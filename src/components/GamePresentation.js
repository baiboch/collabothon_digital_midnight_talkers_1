import React, { useEffect } from 'react';

import Phaser from 'phaser';

export default function GamePresentation({ state, setState }) {
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        document.body.addEventListener('contextmenu', preventContextMenu);

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
        console.log(state.seeds)
        let seeds = state.seeds;
        let trees = [];
        let seedSprites = [];
        let airQuality = 0;

        let treeHealthTexts = [];
        let seedText;
        let airQualityText;
        let gameOverText;

        function preload() {
            this.load.image('background', '/images/background.webp');
            this.load.image('tree', '/images/tree.png');
            this.load.image('seed', '/images/seed.png');
            this.load.image('water', '/images/water.png');
        }

        function create() {
            // add background
            const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
            const scaleX = game.config.width / background.width;
            const scaleY = game.config.height / background.height;
            const scale = Math.max(scaleX, scaleY);
            background.setScale(scale).setScrollFactor(0);

            // add counters text
            seedText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#000' });
            airQualityText = this.add.text(10, 30, '', { font: '16px Arial', fill: '#000' });

            this.input.on('pointerdown', plantTree, this);
            this.input.on('gameobjectdown', pickUpSeed, this);

            // seeds
            this.time.addEvent({
                delay: 5000, // 5 seconds
                callback: generateSeedsFromTrees,
                callbackScope: this,
                loop: true
            });

            // air quality
            this.time.addEvent({
                delay: 7000,  // 7 seconds
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
                font: '32px Arial',
                fill: '#FF0000'
            }).setOrigin(0.5, 0.5);
            gameOverText.visible = false;
        }

        function pickUpSeed(pointer, seedSprite) {
            if (pointer.button === 0) { // left mouse click
                seeds++;
                seedSprite.destroy(); // delete seed
                const index = seedSprites.indexOf(seedSprite);
                if (index > -1) {
                    seedSprites.splice(index, 1); // delete from seeds array
                }
            }
        }

        function generateSeedsFromTrees() {
            // generate seeds from all trees
            trees.forEach(tree => {
                if (tree) {
                    airQuality++;  // increase air quality
                    const x = Math.random() * game.config.width;
                    const y = Math.random() * game.config.height;
                    const seedSprite = this.add.image(x, y, 'seed').setInteractive();
                    seedSprites.push(seedSprite);
                }
            });
        }

        function improveAirQuality() {
            // air quality increase
            airQuality += trees.length;
        }

        function update() {
            // update counters
            seedText.setText('Seeds: ' + seeds);
            airQualityText.setText('Air quality: ' + airQuality);
        }

        function plantTree(pointer) {
            console.log('plantTree', pointer.button);
            const x = pointer.x;
            const y = pointer.y;
            const seedsNeeded = 10;

            if (seeds >= seedsNeeded && pointer.button === 0) {
                const tree = this.add.image(x, y, 'tree');
                tree.setInteractive();
                tree.on('pointerdown', function(event) {
                    waterTree.call(tree, event); // send tree as context
                });
                tree.health = 100;
                trees.push(tree);
                seeds -= seedsNeeded;

                for (let i = 0; i < seedsNeeded && seedSprites.length > 0; i++) {
                    const seedSprite = seedSprites.pop();
                    seedSprite.destroy();
                }

                const healthText = this.add.text(x, y - 20, tree.health.toString(), {
                    font: '16px Arial', fill: '#000'
                });
                treeHealthTexts.push(healthText);
            }
        }

        function waterTree(pointer) {
            console.log(pointer.button, 'waterTree');
            if (pointer.button === 2) {  // right mouse click

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

                this.health += 20;  // increase tree health
                if (this.health > 100) {
                    this.health = 100;  // set max 100
                }

                const index = trees.indexOf(this);
                treeHealthTexts[index].setText(this.health.toString());

                const newScale = 1 + (this.health * 0.01);
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

                    tree.destroy();  // remove tree
                    trees.splice(i, 1);
                    removed = true;
                }
                const newScale = 1 + (tree.health * 0.01);
                tree.setScale(newScale);
            }

            if (removed) {
                airQuality -= 10;  // reduce air quality
                if (airQuality < 0) {
                    airQuality = 0;
                }
            }
            if (trees.length === 0) {
                gameOverText.visible = true;
                // stop all games cycles
                this.scene.pause();
            }
        }

        // window resize handler
        function handleResize() {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }

        function preventContextMenu(event) {
            event.preventDefault();
        }

        return () => {
            document.body.removeEventListener('contextmenu', preventContextMenu);
            window.removeEventListener('resize', handleResize);
            game.destroy(true);
        };
    }, [state]);

    return <div id="phaser-game"></div>;
}
