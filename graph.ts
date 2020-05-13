/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {

    export class Point { t: number; value: number; }
    export class Coordinate { x: number; y: number; }

    export class Curve { points: Array<Point>; label: string; color: string; }

    type CallbackGetColorByLabel = (label: string) => string;
    type CallbackGetColorByIndex = (index: number) => string;

    export class GraphBase {
        constructor(htmlElement: string) {
            var canvas = <HTMLCanvasElement>document.getElementById(htmlElement);
            this.ctx = canvas.getContext("2d");
        }
        ctx: CanvasRenderingContext2D;
        valueMax: number;
        tMax: number;
        xScale: number;
        xOffset: number;
        yScale: number;
        yOffsetWithoutTitle: number;
        xShowTicks: boolean = true;
        yShowTicks: boolean = false;
        yTicksExternalOverride: boolean = false;
        titlePadding: number = 7;
        titleFontSz: number = 10;

        setScale() {
            this.xScale = (this.ctx.canvas.width - 2 * this.xOffset) / (this.tMax - 0);
            this.yScale = (this.ctx.canvas.height - this.yOffsetTop() - this.yOffsetBottom()) / (this.valueMax - 0);
        }

        yOffsetBottom(): number {
            return this.yOffsetWithoutTitle;
        }

        yOffsetTop(): number {
            if (this.titleFontSz < 6) alert("Illegal fontsize " + this.titleFontSz + " in GraphBase");

            var yoffset = this.yOffsetWithoutTitle;
            
            if (this.title.length > 0) {
                yoffset += this.titlePadding; // give some ext
            }
            return yoffset;
        }
        
        D2Sc(t: number, value: number): Coordinate {
            var c = new Coordinate();
            c.x = this.xOffset + this.xScale * (t - 0); // / (this.tMax - 0);
            c.y = this.ctx.canvas.height - this.yOffsetBottom() - this.yScale * (value - 0); // / (this.valueMax - 0);
            return c;
        }

        clear() {
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.fillStyle = '#f8f8f8';
            this.ctx.fill();
        }

        protected xTicks: Array<Tick>;
        protected yTicks: Array<Tick>;

        // old code from my Graphs library
        protected determineXTickPoints(skip0: boolean = true) {
            this.xTicks = new Array<Tick>();

            if (this.tMax < 0) alert("Invalid tMax value!");

            // Control always draws up and until XMaxData, but how many x-ticks and where?
            var Z = Math.floor(Math.log10(this.tMax));
            var M = this.tMax / Math.pow(10, Z);
            var D = 0.5;
            if (M >= 2.5) D = 1;
            if (M >= 5) D = 2;
            D *= Math.pow(10, Z);

            // Data X range is assumed to eventually grow far beyond 1,
            // so I set the minimum X range to [0,1]
            if (this.tMax <= 1) D = 1;

            // The Xds is used for data to screen projection scaling and is the 
            // max X that will be drawn (it is the ceiling tick for the max data X)
            //XMaxDraw = D * Math.Ceiling(XMaxData / D);

            for (var i = (skip0 ? D : 0); i <= this.tMax; i += D) {
                var c = this.D2Sc(i, 0);
                var tick = new Tick();
                tick.value = c.x;
                tick.label = "" + i.toFixed(0);
                this.xTicks.push(tick);
            }
        }


        protected determineYTickPoints(skip0: boolean = true) {
            this.yTicks = new Array<Tick>();

            if (this.valueMax < 0) alert("Invalid tMax value!");

            // Control always draws up and until XMaxData, but how many x-ticks and where?
            var Z = Math.floor(Math.log10(this.valueMax));
            var M = this.valueMax / Math.pow(10, Z);
            var D = 0.5;
            if (M >= 2.5) D = 1;
            if (M >= 5) D = 2;
            D *= Math.pow(10, Z);
            if (this.valueMax <= 1) D = 1;

            for (var i = (skip0 ? D : 0); i <= this.valueMax; i += D) {
                var c = this.D2Sc(0, i);
                var tick = new Tick();
                tick.value = c.y;
                tick.label = "" + i.toFixed(0);
                this.yTicks.push(tick);
            }
        }

        title: string = "";
        drawTitle() {
            if (this.title.length > 0) {
                var titlemidY = this.yOffsetTop() / 2;
                var titlemidX = this.ctx.canvas.width / 2;
                this.ctx.beginPath();
                this.ctx.fillStyle = '#444444';
                this.ctx.textBaseline = "middle";
                this.ctx.textAlign = "center";
                this.ctx.font = "" + this.titleFontSz + "px Arial";
                this.ctx.fillText(this.title, titlemidX, titlemidY);
            }
        }

        drawTicks() {
            if (this.xShowTicks) {
                this.determineXTickPoints();
                for (var tx of this.xTicks) {
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = '#80808080';
                    this.ctx.beginPath();
                    this.ctx.moveTo(tx.value, this.ctx.canvas.height - this.yOffsetBottom());
                    this.ctx.lineTo(tx.value, this.yOffsetTop());
                    this.ctx.stroke();

                    var str = tx.label;
                    this.ctx.fillStyle = '#000000';
                    this.ctx.textBaseline = "top";
                    this.ctx.textAlign = "center";
                    this.ctx.font = "8px Arial";
                    this.ctx.fillText(str, tx.value, this.ctx.canvas.height - this.yOffsetBottom() + 3);
                }
            }

            if (this.yShowTicks) {
                if (!this.yTicksExternalOverride)
                    this.determineYTickPoints();

                // for this simulation no labels..
                // (otherwise have to measure width of string, change x - offset of axis, etc..No time to implement that now..)
                for (var ty of this.yTicks) {
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = '#80808080';
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.xOffset, ty.value);
                    this.ctx.lineTo(this.ctx.canvas.width - this.xOffset, ty.value);
                    this.ctx.stroke();
                }
            }
        }

        drawAxes() {
            // draw axes
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.moveTo(this.xOffset, this.ctx.canvas.height - this.yOffsetBottom());
            this.ctx.lineTo(this.xOffset, this.yOffsetTop());
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.xOffset, this.ctx.canvas.height - this.yOffsetBottom());
            this.ctx.lineTo(this.ctx.canvas.width - this.xOffset, this.ctx.canvas.height - this.yOffsetBottom());
            this.ctx.stroke();
        }
    }


    export class BinComponent {
        index: number;
        nr: number;
    }

    export class Bin {
        
        ID: string;
        lowerBound: number;
        upperBoundIncl: number;
        binComponents: BinComponent[] = [];

        setComponent(index: number, nr: number) {
            var comp = this.binComponents.find(zz => zz.index == index);
            if (comp == null) {
                comp = new BinComponent();
                comp.index = index;
                this.binComponents.push(comp);
            }
            comp.nr = nr;
        }
    }

    export class StackedHistogram extends GraphBase {
        constructor(htmlElement: string) {
            super(htmlElement);
        }

        init(callbackComponentColor: CallbackGetColorByIndex) {
            this.valueMax = 1;
            this.tMax = 1;
            this.xOffset = 10;
            this.yOffsetWithoutTitle = 10;
            this.bins = new Array<Bin>();
            this.callbackGetComponentColor = callbackComponentColor;
        }

        callbackGetComponentColor: CallbackGetColorByIndex;

        addBin(binID: string, lb: number, ub: number) : Bin {

            for (var bin of this.bins) {
                if ((ub <= bin.upperBoundIncl && ub >= bin.lowerBound) ||
                    (lb >= bin.lowerBound && lb <= bin.upperBoundIncl)) {
                    alert("Bin overlap");
                    return;
                }
                if (bin.ID == binID) {
                    alert("Bin ID duplicate");
                    return;
                }
            }

            var bin = new Bin();
            bin.ID = binID;
            bin.lowerBound = lb;
            bin.upperBoundIncl = ub;
            this.bins.push(bin);
            return bin;
        }

        setComponentValue(binID: string, componentIndex: number, nr: number) {
            var bin = this.getBin(binID);
            var comp = bin.binComponents.find(zz => zz.index == componentIndex);
            if (comp == null) {
                alert("Component " + componentIndex + " not found in bin " + binID);
                return;
            }
            comp.nr = nr;
        }

        getBin(binID: string): Bin {
            var bin = this.bins.find(zz => zz.ID == binID);
            if (bin == null) {
                alert("Bin with ID " + binID + " not found");
            }
            return bin;
        }
        
        bins: Array<Bin>;

        draw() {
            this.clear();

            this.tMax = 1;
            this.valueMax = 1;
            for (var bin of this.bins) {
                var rub = bin.upperBoundIncl + 0.99;
                if (rub > this.tMax) this.tMax = rub; 
                var sum = 0;
                bin.binComponents.forEach(zz => sum += zz.nr);
                if (sum > this.valueMax) this.valueMax = sum;
            }

            this.setScale();
            this.determineYTickPoints(true);

            for (var bin of this.bins) {
                var cum = 0;
                for (var comp of bin.binComponents) {
                    var cBR = this.D2Sc(bin.upperBoundIncl + 0.98, cum);
                    cum += comp.nr;
                    var cTL = this.D2Sc(bin.lowerBound, cum);

                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.callbackGetComponentColor(comp.index);
                    this.ctx.fillRect(cTL.x, cTL.y, cBR.x - cTL.x, cBR.y - cTL.y);
                }
            }

            this.drawAxes();
            this.drawTicks();
            this.drawTitle();
        }
    }

    export class Graph extends GraphBase {
        constructor(htmlElement: string) {
            super(htmlElement);
        }
        
        curves: Array<Curve>;

        getColorByLabel: CallbackGetColorByLabel;

        init(callbackGetColorByLabel: CallbackGetColorByLabel) {
            this.getColorByLabel = callbackGetColorByLabel;
            this.curves = new Array<Curve>();
            this.valueMax = 1;
            this.tMax = 1;
            this.xOffset = 10;
            this.yOffsetWithoutTitle = 10;
        }

        push(curveLabel: string, t: number, value: number) {
            var curve = this.curves.find(zz => zz.label == curveLabel);
            if (curve == null) {
                curve = new Curve();
                curve.label = curveLabel;
                curve.color = this.getColorByLabel(curveLabel);
                curve.points = new Array<Point>();
                this.curves.push(curve);
            }
            var p = new Point();
            p.t = t;
            p.value = value;
            curve.points.push(p);

            if (t > this.tMax) this.tMax = t;
            if (value > this.valueMax) {
                this.valueMax = value;
                console.debug("max " + value);
            }
        }

        setPctYTicks(nr: number) {

            // don't do 100 and 0, too obvious
            var fr = 1 / (1 + nr);
            this.yTicks = new Array<Tick>();

            var ydelta = (this.ctx.canvas.height - this.yOffsetBottom() - this.yOffsetTop());
            for (var i = 1; i <= nr; i++) {
                var tick = new Tick();
                tick.value = this.ctx.canvas.height - this.yOffsetBottom() - i * fr * ydelta;
                tick.label = ("" + (100 + (fr * i * 100))).substr(1, 2);
                this.yTicks.push(tick);
            }
        }
        
        draw() {
            this.clear();
            this.setScale();

            for (var ci = 0; ci < this.curves.length; ci++) {
                var curve = this.curves[ci];
                this.ctx.beginPath();
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = curve.color;
                this.ctx.beginPath();
                var origin = this.D2Sc(0, 0);
                this.ctx.moveTo(origin.x, origin.y);
                for (var pt of curve.points) {
                    var c = this.D2Sc(pt.t, pt.value);
                    this.ctx.lineTo(c.x, c.y);
                }
                this.ctx.stroke();
            }

            this.drawAxes();
            this.drawTicks();
            this.drawTitle();
        }
    }

    export class Stack {
        t: number;
        values: number[];
    }

    class Tick {
        value: number;
        label: string;
    }

    export enum StackGraphFillType { TOP, BOTTOM }
    export class StackedGraph extends GraphBase {
        constructor(htmlElement: string) {
            super(htmlElement);
        }
        colors: string[];

        fillType: StackGraphFillType[];

        init() {
            this.valueMax = 1;
            this.tMax = 1; 
            this.xOffset = 10;
            this.yOffsetWithoutTitle = 10;
            this.nrInStack = -1;
            this.stacks = new Array<Stack>();
        }

        yThresholdLineShow: boolean = false;
        yThresholdLine: number = null;
        yThresholdLabel: string = "";
        setThresholdLine(y: number, label: string) {
            this.yThresholdLine = y;
            this.yThresholdLabel = label;
        }

        nrInStack: number = -1;
        push(t: number, values: number[]) {
            var stack = this.stacks.find(zz => zz.t == t);
            if (stack != null) {
                alert("Stack already present!");
                return;
            }

            if (this.stacks.length > 0) {
                if (values.length != this.nrInStack) {
                    alert("Nr of values for stack invalid!");
                    return;
                }
            }
            this.nrInStack = values.length;
            if (values.length > this.colors.length) {
                alert("Nr of colors too low for nr of values in stack");
                return;
            }

            var stack = new Stack();
            stack.t = t;
            stack.values = values;
            this.stacks.push(stack);

            if (t > this.tMax) this.tMax = t;

            for (var val of stack.values) {
                if (val > this.valueMax) this.valueMax = val;
            }
        }

        stacks: Array<Stack> = [];

        draw(cumulative: boolean, fill: boolean) {
            this.clear();

            if (this.nrInStack > 0 && this.stacks.length > 0) {
                this.setScale();

                this.stacks.sort((n1, n2) => n1.t - n2.t);

                let polygons = [];
                for (var n = 0; n < this.nrInStack; n++) polygons.push(new Array<Coordinate>());
                for (var stack of this.stacks) {
                    var v = 0;
                    for (var n = 0; n < stack.values.length; n++) {
                        if (cumulative)
                            v += stack.values[n];
                        else
                            v = stack.values[n];
                        polygons[n].push(this.D2Sc(stack.t, v));
                    }
                }

                for (var p = polygons.length - 1; p >= 0; p--) {
                    var polygon = polygons[p];
                    if (fill) {
                        this.ctx.beginPath();
                        this.ctx.fillStyle = this.colors[p];

                        var origin = new Coordinate();
                        origin.x = this.xOffset;
                        origin.y = this.ctx.canvas.height - this.yOffsetBottom();
                        if (this.fillType[p] == StackGraphFillType.TOP)
                            origin.y = this.yOffsetTop();
                        this.ctx.moveTo(origin.x, origin.y);

                        for (var n = 0; n < polygon.length; n++) {
                            this.ctx.lineTo(polygon[n].x, polygon[n].y);
                        }
                        this.ctx.lineTo(polygon[polygon.length - 1].x, origin.y);
                        this.ctx.closePath();
                        this.ctx.fill();
                    }
                    else {
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = this.colors[p];
                        this.ctx.lineWidth = 1;
                        this.ctx.moveTo(polygon[0].x, polygon[0].y);
                        for (var n = 1; n < polygon.length; n++) {
                            this.ctx.lineTo(polygon[n].x, polygon[n].y);
                        }

                        //this.ctx.closePath();
                        this.ctx.stroke(); //.fill();
                    }
                }
            }

            if (this.yThresholdLine != null && this.yThresholdLineShow) {
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#000000';
                this.ctx.beginPath();
                var cc = this.D2Sc(0, this.yThresholdLine);
                this.ctx.moveTo(this.xOffset, cc.y);
                this.ctx.lineTo(this.ctx.canvas.width - this.xOffset, cc.y);
                this.ctx.stroke();

                var str = this.yThresholdLabel + "  " + ("" + (1000 + this.yThresholdLine)).substr(1, 3);
                this.ctx.fillStyle = '#000000';
                this.ctx.textBaseline = "bottom";
                this.ctx.textAlign = "left";
                this.ctx.font = "bold 11px Arial";
                this.ctx.fillText(str, this.xOffset + 50, cc.y);
            }

            this.drawAxes();
            this.drawTicks();
            this.drawTitle();
        }
    }

}