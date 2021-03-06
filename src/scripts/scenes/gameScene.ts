import Grid from '../grid/grid';
import mapData from '../maps/default.json';
import MoneyText from '../objects/moneyText';
import StopMarker from '../objects/stopMarker';
import Node from '../grid/node';

import _ from 'lodash';
import Bus from '../objects/bus';
import PotentialStopMarker from '../objects/potentialMarker';
import FloatingText from '../objects/floatingText';
import IntroHelp from '../objects/introHelp';
import FirstMadeHelp from '../objects/firstStopMade';
import RepairHelp from '../objects/repairHelp';
import UpgradeHelp from '../objects/upgradeHelp';

export default class GameScene extends Phaser.Scene {
    grid: Grid;
    addingNewRoute = false;

    newRouteButton: Phaser.GameObjects.Rectangle;

    modeText: Phaser.GameObjects.Text;
    potentialStopMarkers: Phaser.GameObjects.Group;

    potentialFirstStop: PotentialStopMarker | undefined;

    routes: any[] = [];
    busses: Bus[] = [];
    money = 500;
    moneyText: MoneyText;
    distanceModifier = 1.75;
    routeCountModifier = () => {
        return Math.max(1, Math.log(this.routes.length)) * 1.7;
    };

    firstStop: StopMarker;
    hasHadBreakdown = false;
    colors: number[] = [
        0x1ea362,
        0x4a89f3,
        0x506487,
        0x57cac6,
        0xbcda6e,
        0xf3716f,
        0xd34f59,
        0xc3ecb2,
        0xaadaff,
        0xbcda6e,
        0xe97439,
        0xe64a39,
        0xedd157,
        0x6f1bc6,
        0x65ed99,
        0xd9153b,
        0xff1d47,
        0x333333,
        0xff6a6a,
        0x6a9838,
        0xeb8e00,
        0xed7770,
        0x5f7aff,
    ];

    frameTime = 0;

    stopCost = 200;
    baseStopCost = 250;

    upgradeBaseCost = 1000;
    upgradeCount = 0;
    upgradeCostModifier = 1.75;
    upgradeCost =
        this.upgradeBaseCost + this.upgradeCount * this.upgradeCostModifier;
    upgradeText: Phaser.GameObjects.Text;
    upgradeButton: Phaser.GameObjects.Rectangle;
    hasShownUpgradeHelp = false;
    upgradelanguage: Phaser.GameObjects.Text;
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.add.sprite(0, 0, 'map').setOrigin(0);
        this.moneyText = new MoneyText(this);
        const swapKey = this.input.keyboard.addKey('Q');
        swapKey.on('down', evt => {
            if (this.input.keyboard.addKey('U').isUp) return;
            this.scene.start('editorScene');
        });
        this.grid = new Grid();
        this.grid.loadFromJSON(mapData);

        this.potentialStopMarkers = this.add.group();
        this.grid.nodes
            .filter(node => node.canBeBusstop)
            .forEach(node => {
                const marker = new PotentialStopMarker(
                    this,
                    node.x + 2,
                    node.y - 10,
                    200,
                    node.id
                );

                marker.on('pointerdown', pointer => {
                    const inspectKey = this.input.keyboard.addKey('V');
                    if (inspectKey.isDown) {
                        console.log(this.grid.getNode(pointer));
                        return;
                    }

                    if (this.potentialFirstStop === marker) {
                        this.potentialFirstStop = undefined;
                        marker.clearTint();
                        this.potentialStopMarkers.setVisible(true);
                        this.potentialStopMarkers.getChildren().forEach(oM => {
                            const m = oM as PotentialStopMarker;
                            let newCost = this.baseStopCost;
                            if (this.firstStop) {
                                newCost =
                                    this.baseStopCost +
                                    (this.grid.weights[this.firstStop.id][
                                        m.getData('nodeid')
                                    ] *
                                        this.distanceModifier +
                                        this.routes.length *
                                            this.routeCountModifier());
                            }

                            m.updateCost(newCost);
                            m.onMoneyUpdate(this.money);
                        });
                        // .setActive(true);
                        return;
                    }
                    if (!marker.getData('available')) return;

                    //about to finalize new route
                    if (this.potentialFirstStop) {
                        //we have picked our two stops
                        //create a route here

                        const color = _.sample(this.colors);
                        console.log(color);
                        const pinA = new StopMarker(
                            this,
                            this.potentialFirstStop.x - 2,
                            this.potentialFirstStop.y - 2,
                            color,
                            this.potentialFirstStop.getData('nodeid')
                        );
                        const pinB = new StopMarker(
                            this,
                            marker.x - 2,
                            marker.y - 2,
                            color,
                            marker.getData('nodeid')
                        );
                        console.log(
                            'some info',
                            this.potentialFirstStop.getData('nodeid'),
                            marker.getData('nodeid')
                        );
                        const path = this.grid.getPathById(
                            this.potentialFirstStop.getData('nodeid'),
                            marker.getData('nodeid')
                        );
                        console.log('path', path);
                        const locationsToDraw = path.map(node => {
                            return [node.x, node.y];
                        });
                        console.log('loc', locationsToDraw);
                        let routeLines: Phaser.GameObjects.Line[] = [];
                        for (let i = 1; i < locationsToDraw.length; i++) {
                            const [x1, y1] = locationsToDraw[i - 1];
                            const [x2, y2] = locationsToDraw[i];
                            routeLines.push(
                                this.addLine(x1, y1, x2, y2, color)
                            );
                        }
                        const route = {
                            pinA,
                            pinB,
                            routeLines,
                            id: this.routes.length,
                            locations: locationsToDraw,
                        };
                        if (this.routes.length == 0) {
                            this.firstStop = pinA;
                            new FirstMadeHelp(this);
                        }
                        this.routes.push(route);
                        this.potentialFirstStop.setData('isBusStop', true);
                        marker.setData('isBusStop', true);
                        this.potentialStopMarkers.remove(marker, true);
                        this.potentialStopMarkers.remove(
                            this.potentialFirstStop,
                            true
                        );
                        this.potentialFirstStop.destroy();

                        this.toggleNewRoute();
                        this.editMoney(-this.stopCost);
                        //spawn our bus and get it to start making money
                        this.busses.push(new Bus(this, route));
                        this.potentialStopMarkers.getChildren().forEach(oM => {
                            const m = oM as PotentialStopMarker;
                            let newCost =
                                this.baseStopCost +
                                (this.grid.weights[this.firstStop.id][
                                    m.getData('nodeid')
                                ] *
                                    this.distanceModifier +
                                    this.routes.length *
                                        this.routeCountModifier());

                            m.updateCost(newCost);
                            m.onMoneyUpdate(this.money);
                        });
                        new FloatingText(
                            this,
                            marker.x,
                            marker.y,
                            `New Route!`
                        ); // JUUUIIIIICCCCEEE
                        marker.destroy();
                        return;
                    }

                    //we are picking this stop first
                    this.potentialFirstStop = marker;
                    marker.setTint(0xaaaa00);
                    marker.tintFill = true;

                    const minDistance = 80; // technically in screen space and eucledian distance

                    const suitableEnds = this.grid.getNodesInRange(
                        node,
                        minDistance
                    );

                    const suitableIds = suitableEnds.map(n => n.id);
                    //with side effects update the cost of these markers and trigger on money update

                    const markersToAffect = this.potentialStopMarkers
                        .getChildren()
                        .filter(marker => {
                            return suitableIds.includes(
                                marker.getData('nodeid')
                            );
                        });
                    markersToAffect.forEach(oM => {
                        const m = oM as PotentialStopMarker;
                        let newCost =
                            this.baseStopCost +
                            (this.grid.weights[marker.getData('nodeid')][
                                m.getData('nodeid')
                            ] *
                                this.distanceModifier +
                                this.routeCountModifier());
                        if (this.firstStop) {
                            newCost += this.grid.weights[this.firstStop.id][
                                m.getData('nodeid')
                            ];
                        }
                        m.updateCost(newCost);
                        m.onMoneyUpdate(this.money);
                    });
                    // console.log(suitableIds)
                    this.potentialStopMarkers
                        .getChildren()
                        .filter(marker => {
                            const nodeid = marker.getData('nodeid');
                            return (
                                !suitableIds.includes(nodeid) &&
                                nodeid !=
                                    this.potentialFirstStop?.getData('nodeid')
                            );
                        })
                        .forEach(marker => {
                            // console.log(marker.getData('nodeid'))
                            marker.setActive(false);
                            (marker as Phaser.GameObjects.Sprite).setVisible(
                                false
                            );
                        });
                    // node.isBusstop = true;
                    // this.toggleNewRoute();
                });
                this.potentialStopMarkers.add(marker);
            });
        this.potentialStopMarkers.setVisible(false).setActive(false);

        this.modeText = this.add
            .text(425, 20, 'Adding Route')
            .setVisible(false);
        //some new route button
        this.newRouteButton = this.add
            .rectangle(1200, 685, 120, 42, 0xc3ecb2)
            .setInteractive()
            .on('pointerdown', pointer => {
                this.toggleNewRoute();
            });
        this.add.text(1160, 677, 'New Route').setColor('black');
        this.input.keyboard.addKey('ESC').on('down', evt => {
            if (this.addingNewRoute) {
                this.toggleNewRoute();
            }
        });

        this.upgradeText = this.add
            .text(1180, 575, `$${this.upgradeCost}`)
            .setColor('black')
            .setVisible(false);
        this.upgradeButton = this.add
            .rectangle(1200, 620, 120, 42, 0xaaaaaa)
            .setInteractive()
            .on('pointerdown', pointer => {
                //upgrade busses which increases reliability and speed?
                if (this.money < this.upgradeCost) {
                    new FloatingText(this, 1138, 570, 'Insufficient Funds!');
                    return;
                }

                this.upgradeBusses();
            })
            .on('pointerover', pointer => {
                this.upgradeText.setText(`$${this.upgradeCost}`);
                this.upgradeText.setActive(true).setVisible(true);
            })
            .on('pointerout', pointer => {
                this.upgradeText.setActive(false).setVisible(false);
            });
        // .setVisible(false)
        // .setActive(false);
        this.upgradelanguage = this.add
            .text(1168, 605, 'Upgrade\n Buses')
            .setColor('black');
        // .setVisible(false);

        new IntroHelp(this);
        // new UpgradeHelp(this)
        // new FirstMadeHelp(this);
        // new RepairHelp(this)
    }

    private toggleNewRoute() {
        this.addingNewRoute = !this.addingNewRoute;
        this.modeText.setVisible(this.addingNewRoute);
        this.potentialStopMarkers
            .setVisible(this.addingNewRoute)
            .setActive(this.addingNewRoute);

        this.potentialFirstStop = undefined;
        this.potentialStopMarkers.setTint(0xffffff);
    }

    private addLine(x1, y1, x2, y2, color: number) {
        return this.add
            .line(x1, y1, 0, 0, -1 * (x1 - x2), -1 * (y1 - y2), color)
            .setOrigin(0)
            .setLineWidth(2);
    }

    public editMoney(amountToAdd) {
        this.money += amountToAdd;

        if (this.money < this.stopCost) {
            this.newRouteButton.setActive(false);
            this.newRouteButton.setFillStyle(0xaaaaaa);
        } else {
            this.newRouteButton.setActive(true);
            this.newRouteButton.setFillStyle(0xc3ecb2);
        }

        this.potentialStopMarkers.getChildren().forEach(marker => {
            (marker as PotentialStopMarker).onMoneyUpdate(this.money);
        });

        // this.upgradeButton
        //     .setActive(this.money >= this.upgradeCost)
        //     // .setVisible(this.money >= this.upgradeCost);
        // this.upgradelanguage
        //     .setActive(this.money >= this.upgradeCost)
        //     // .setVisible(this.money >= this.upgradeCost);

        if (this.money >= this.upgradeCost) {
            this.upgradeButton.setFillStyle(0xc3ecb2);
        } else {
            this.upgradeButton.setFillStyle(0xaaaaaa);
        }
        if (!this.hasShownUpgradeHelp && this.money >= this.upgradeCost) {
            //show upgrade helper here
            new UpgradeHelp(this);
            this.hasShownUpgradeHelp = true;
            this.upgradeButton.setActive(true).setVisible(true);
            this.upgradelanguage.setActive(true).setVisible(true);
        }
    }

    public upgradeBusses() {
        this.upgradeCount++;
        this.busses.forEach(bus => {
            bus.upgrade();
        });
        this.editMoney(-this.upgradeCost);
        this.upgradeCost =
            this.upgradeBaseCost *
            (this.upgradeCount * this.upgradeCostModifier);
        this.upgradeText.setText(`$${this.upgradeCost}`);
    }

    update(time, delta) {
        this.moneyText.update(this.money);

        this.frameTime += delta;

        if (this.frameTime > 16.5) {
            this.frameTime = 0;
            this.busses.forEach(bus => {
                bus.tick();
            });
            // Code that relies on a consistent 60 update per second
        }
    }
}
