import React, { useEffect } from 'react';

import Phaser from 'phaser';

export default function Game({ state }) {

    const INITIAL_SEEDS_NUMBER = state.seeds;
    const INDICATOR_TEXT_COLOR = '#FFFFFF';
    const GAME_OVER_TEXT_COLOR = '#FF0000';
    const FONT_SIZE_AND_FAMILY = '16px Arial';
    const GAME_OVER_TEXT_SIZE = '32px Arial';

    useEffect(() => {
        let seeds = INITIAL_SEEDS_NUMBER;
        let trees = [];
        let seedSprites = [];
        let airQuality = 0;

        let treeHealthTexts = [];
        let seedText;
        let airQualityText;
        let gameOverText;

        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            scene: {
                preload: preload,
                create: create,
                update: update,
            },
        };
        const game = new Phaser.Game(config);

        function preload() {
            this.load.image('background', '/images/background.jpeg');
            this.load.image('tree', '/images/tree.png');
            this.load.image('seed', '/images/seed.png');
            this.load.image('water', '/images/water.png');
            this.load.image('factory', '/images/factory.webp');
        }

        function create() {
            // add background
            const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
            const scaleX = game.config.width / background.width;
            const scaleY = game.config.height / background.height;
            const scale = Math.max(scaleX, scaleY);
            background.setScale(scale).setScrollFactor(0);

            // add counters text
            seedText = this.add.text(10, 10, '', { font: FONT_SIZE_AND_FAMILY, fill: INDICATOR_TEXT_COLOR });
            airQualityText = this.add.text(10, 30, '', { font: FONT_SIZE_AND_FAMILY, fill: INDICATOR_TEXT_COLOR });

            scheduleFactory(this);

            this.input.on('pointerdown', plantSeed, this);
            this.input.on('gameobjectdown', pickUpSeed, this);

            this.time.addEvent({
                delay: 1000, // 5 seconds
                callback: generateSeedsFromTrees,
                callbackScope: this,
                loop: true
            });

            // air quality
            this.time.addEvent({
                delay: 7000,
                callback: improveAirQuality,
                callbackScope: this,
                loop: true
            });

            // degrade trees and air
            this.time.addEvent({
                delay: 10000,  // every 10 seconds
                callback: degradeTreesAndAir,
                callbackScope: this,
                loop: true
            });

            // game over part
            gameOverText = this.add.text(game.config.width / 2, game.config.height / 2, 'Game Over', {
                font: GAME_OVER_TEXT_SIZE,
                fill: GAME_OVER_TEXT_COLOR,
            }).setOrigin(0.5, 0.5);
            gameOverText.visible = false;
        }

        function generateSeedsFromTrees() {
            trees.forEach(tree => {
                if (tree && !tree.hasGeneratedSeed) {
                    airQuality++;  // increase air quality
                    tree.hasGeneratedSeed = true;

                    const x = Math.random() * game.config.width;
                    const y = Math.random() * game.config.height;
                    const seedSprite = this.add.image(x, y, 'seed').setInteractive();
                    seedSprites.push(seedSprite);
                }
            });
        }

        function pickUpSeed(pointer, seedSprite) {

            if (seedSprite.texture.key !== 'seed') {
                return;
            }
            if (pointer.button === 0) {
                seeds++;
                seedSprite.destroy();
                const index = seedSprites.indexOf(seedSprite);
                if (index > -1) {
                    seedSprites.splice(index, 1);
                }
            }
        }

        function improveAirQuality() {
            // air quality increase
            airQuality += trees.length;
        }

        function update() {
            seedText.setText('Seeds: ' + seeds);
            airQualityText.setText('Air quality: ' + airQuality);
        }

        function plantSeed(pointer) {
            const x = pointer.x;
            const y = pointer.y;

            if (seeds > 0 && pointer.button === 0) {
                const seed = this.add.image(x, y, 'seed').setInteractive();
                seed.on('pointerdown', function(event) {
                    if (event.button === 2) {
                        const drop = this.scene.add.image(seed.x, seed.y - 30, 'water');
                        this.scene.tweens.add({
                            targets: drop,
                            y: seed.y,
                            alpha: 0,
                            duration: 500,
                            onComplete: function() {
                                drop.destroy();
                            }
                        });
                        growSeedIntoTree.call(this, seed, this.scene);
                    } else {
                        pickUpSeed.call(this, event, seed);
                    }
                });
                seed.growthTime = 5000;
                seedSprites.push(seed);
                seeds--;
            }
        }

        function growSeedIntoTree(seed, context) {
            console.log("growSeedIntoTree");
            const x = seed.x;
            const y = seed.y;
            seed.destroy();
            const tree = context.add.image(x, y, 'tree');
            tree.setInteractive();
            tree.setScale(0.1); // initial tree size

            tree.health = 1;
            tree.hasGeneratedSeed = false;

            tree.on('pointerdown', function(event) {
                waterTree.call(tree, event); // send tree as context
            });
            trees.push(tree);

            const healthText = context.add.text(x, y - 20, tree.health.toString(), {
                font: INDICATOR_TEXT_COLOR, fill: '#fff'
            });
            treeHealthTexts.push(healthText);
            context.tweens.add({
                targets: tree,
                scaleX: 2,
                scaleY: 2,
                duration: seed.growthTime,
                ease: 'Linear',
                onUpdate: function(tween, targets) {
                    if (tree.health < 100) {
                        tree.health += 1;
                        const index = trees.indexOf(tree);
                        treeHealthTexts[index].setText(Math.round(tree.health).toString());
                    }
                }
            });
        }

        function waterTree(pointer) {
            console.log(pointer.button, 'waterTree');
            if (pointer.button === 2) {
                const drop = this.scene.add.image(this.x, this.y - 30, 'water');
                this.scene.tweens.add({
                    targets: drop,
                    y: this.y,
                    alpha: 0,
                    duration: 500,
                    onComplete: function() {
                        drop.destroy();
                    }
                });

                this.health += 20;
                if (this.health > 100) {
                    this.health = 100;
                }

                const index = trees.indexOf(this);
                treeHealthTexts[index].setText(this.health.toString());

                const newScale = 1 + (this.health * 0.01);
                console.log(newScale, "newScale")
                this.setScale(newScale);
            }
        }

        function degradeTreesAndAir() {
            let removed = false;

            for (let i = trees.length - 1; i >= 0; i--) {
                const tree = trees[i];
                tree.health -= 20;

                treeHealthTexts[i].setText(tree.health.toString());
                if (tree.health <= 0) {
                    treeHealthTexts[i].destroy();
                    treeHealthTexts.splice(i, 1);

                    tree.destroy();
                    trees.splice(i, 1);
                    removed = true;
                }
                const newScale = 1 + (tree.health * 0.01);
                tree.setScale(newScale);
            }

            if (removed) {
                airQuality -= 10;
                if (airQuality < 0) {
                    airQuality = 0;
                }
            }
            if (trees.length === 0 || airQuality <= 0) {
                airQuality = 0;

                gameOverText.visible = true;

                for (let i = trees.length - 1; i >= 0; i--) {
                    trees[i].destroy();
                    treeHealthTexts[i].destroy();
                }
                trees = []
                this.scene.pause();
            }
        }

        function scheduleFactory(context) {
            const randomTime = Math.random() * (5000 - 1000) + 10000;
            setTimeout(() => {
                showFactory(context);
                scheduleFactory(context);
            }, randomTime);
        }

        function showFactory(context) {
            if (!context || !context.add) {
                console.error('error showFactory');
                return;
            }

            const screenWidth = config.width;
            const screenHeight = config.height;

            const factory = context.add.image(0, 0, 'factory');
            const factoryWidth = factory.width;
            const factoryHeight = factory.height;

            factory.setX(screenWidth - factoryWidth);
            factory.setY(screenHeight - factoryHeight);
            factory.setAlpha(0);

            context.tweens.add({
                targets: factory,
                alpha: 1,
                duration: 1000,
                onComplete: () => {
                    setTimeout(() => {
                        factory.destroy();

                        console.log(airQuality, 'before reduce air');

                        let percentReduce = Math.round(airQuality * 50 / 100);
                        console.log(percentReduce, 'air % reduce');

                        airQuality -= percentReduce > 0 ? percentReduce : 0;
                        if (airQuality < 0) {
                            airQuality = 0;
                        }
                        console.log(airQuality, 'reduce air');
                    }, 5000);
                }
            });
        }

        function handleResize() {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }

        function preventContextMenu(event) {
            event.preventDefault();
        }

        window.addEventListener('resize', handleResize);
        document.body.addEventListener('contextmenu', preventContextMenu);

        return () => {
            document.body.removeEventListener('contextmenu', preventContextMenu);
            window.removeEventListener('resize', handleResize);
            game.destroy(true);
        };
    }, [state]);

    return <div id="phaser-game"></div>;
}
