'use strict';

Vue.component('minesweeperControl', {
    props: {
        nbMines: Number,
        timer: Number,
        hasFailed: Boolean,
        hasWin: Boolean,
    },
    computed: {
        strTimer: function() {
            const timer = this.timer;
            let nbMin = Math.floor(timer / 60).toString();
            let nbSec = (timer % 60).toString();

            if (nbMin.length < 2) {
                nbMin = '0' + nbMin;
            }

            if (nbSec.length < 2) {
                nbSec = '0' + nbSec;
            }

            return nbMin + ':' + nbSec;
        },
        status: function() {
            if (this.hasFailed) {
                return 'failed';
            }
            if (this.hasWin) {
                return 'win';
            }
            if (this.timer > 0) {
                return 'analyzing';
            }
            return 'ready';
        },
    },
    template: `
<menu class="sweeper-menu">
    <output class="nbMines">
        {{nbMines}}
    </output>
    <span :class="status">{{status}}</span>
    <output class="timer">
        {{strTimer}}
    </output>
</menu>
    `
});

Vue.component('minesweeperCell', {
    props: {
        value: Number,
        x: Number,
        y: Number,
        isFinished: Boolean,
    },
    data: function() {
        return {
            visible: false,
            flag: ' '
        };
    },
    computed: {
        clickable: function() {
            return !this.visible && !this.isFinished;
        },
    },
    methods: {
        activate: function() {
            if (this.clickable && this.flag !== 'M') {
                this.visible = true;
                this.$emit('change', this.x, this.y, 'click', this.value);
            }
        },
        changeFlag: function () {
            if (this.clickable) {
                const flags = [' ', 'M', '?'];
                const flag = flags[(flags.indexOf(this.flag) + 1) % flags.length];
                this.flag = flag;

                if (flag === 'M') {
                    this.$emit('change', this.x, this.y, 'flag', 1);
                } else
                if (flag === '?') {
                    this.$emit('change', this.x, this.y, 'flag', -1);
                }
            }
        },
    },
    template: `
<td>
    <button v-if = "!visible"
        class="mine-cell"
        @click="activate"
        @click.right.prevent.stop="changeFlag"
    >
        {{flag}}
    </button>
    <span v-else
        class="mine-cell"
    >
        {{value}}
    </span>
</td>
    `
});

Vue.component('minesweeperGrid', {
    props: {
        sizeX: Number,
        sizeY: Number,
        nbMines: Number,
        isFinished: Boolean,
    },
    data: function() {
        const mineGrid = this.initMineGrid();
        const grid = this.initGrid(mineGrid);

        return {
            mineGrid: mineGrid,
            grid: grid,
        };
    },
    methods: {
        initMineGrid: function() {
            const sizeX = this.sizeX, sizeY = this.sizeY;
            let nbMines = this.nbMines;
            const grid = new Array(sizeY);

            for (let y = 0; y < sizeY; y++) {
                grid[y] = new Array(sizeX);
                for (let x = 0; x < sizeX; x++) {
                    grid[y][x] = false;
                }
            }

            while (nbMines > 0) {
                const x = Math.floor(Math.random() * sizeX);
                const y = Math.floor(Math.random() * sizeY);

                if (!grid[y][x]) {
                    grid[y][x] = true;
                    nbMines--;
                }
            }

            return grid;
        },
        initGrid: function (mineGrid) {
            const sizeY1 = this.sizeY - 1;
            const grid = mineGrid.map((row, y) => {
                return row.map((mine, x) => {
                    if (mine) {
                        return -1;
                    }
                    let count = 0;
                    if (y > 0) {
                        count += mineGrid[y - 1][x - 1] || 0;
                        count += mineGrid[y - 1][x];
                        count += mineGrid[y - 1][x + 1] || 0;
                    }
                    count += mineGrid[y][x - 1] || 0;
                    count += mineGrid[y][x + 1] || 0;
                    if (y < sizeY1) {
                        count += mineGrid[y + 1][x - 1] || 0;
                        count += mineGrid[y + 1][x];
                        count += mineGrid[y + 1][x + 1] || 0;
                    }
                    return count;
                });
            });

            return grid;
        },
        changeCell: function(x, y, action, value) {
            if (this.isFinished) {
                return;
            }
            switch (action) {
                case 'flag': this.$emit('change', 'flag', value); break;
                case 'click':
                    if (value < 0) {
                        this.$emit('change', 'mine', 1);
                    } else {
                        this.$emit('change', 'click', 1);

                        if (value === 0) {
                            this.activate(x - 1, y - 1);
                            this.activate(x - 1, y);
                            this.activate(x - 1, y + 1);
                            this.activate(x, y - 1);
                            this.activate(x, y + 1);
                            this.activate(x + 1, y - 1);
                            this.activate(x + 1, y);
                            this.activate(x + 1, y + 1);
                        }
                    }
                    break;
            }
        },
        activate: function(x, y) {
            if (x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY) {
                this.$refs['cell' + x + '-' + y][0].activate();
            }
        },
    },
    template: `
<table>
    <tr v-for="(row, y) of grid"
        :key = "'row' + y"
    >
        <minesweeperCell v-for="(cell, x) of row"
            :key = "'cell' + x + '-' + y"
            :ref = "'cell' + x + '-' + y"
            :value = "cell"
            :x = "x"
            :y = "y"
            :isFinished = "isFinished"
            @change = "changeCell"
        />
    </tr>
</table>
    `
});

Vue.component('minesweeper', {
    data: function() {
        return {
            hasFailed: false,
            nbMines: 10,
            sizeX: 10,
            sizeY: 10,
            flags: 0,
            nbClick: 0,
            timer: 0,
        };
    },
    computed: {
        nbFreeCells: function() {
            return this.sizeX * this.sizeY - this.nbMines;
        },
        hasWin: function() {
            return this.nbFreeCells === this.nbClick;
        },
        leftMines: function() {
            return this.nbMines - this.flags;
        },
        isFinished: function() {
            const isFinished = this.hasFailed || this.hasWin;

            if (isFinished) {
                clearInterval(this.intervalTimer);
            }
            return isFinished;
        }
    },
    methods: {
        change: function(type, inc = 1) {
            switch (type) {
                case 'click': this.nbClick += inc; this.startTimer(); break;
                case 'flag': this.flags += inc; break;
                case 'mine': this.hasFailed = true;
            }
        },
        startTimer: function() {
            if (this.intervalTimer) {
                return;
            }
            const now = Math.floor(Date.now() / 1000);

            this.intervalTimer = setInterval(() => {
                this.timer = Math.floor(Date.now() / 1000) - now;
            }, 300);
        }
    },
    template: `
<div>
    <minesweeperControl
        :nbMines = "leftMines"
        :timer = "timer"
        :hasFailed = "hasFailed"
        :hasWin = "hasWin"
    />
    <minesweeperGrid
        :sizeX = "sizeX"
        :sizeY = "sizeY"
        :nbMines = "nbMines"
        :isFinished = "isFinished"
        @change = "change"
    />
</div>
    `
});

new Vue({
    el: '#minesweeper',
    template: `<minesweeper />`
});