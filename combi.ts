/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {
    export class Combi {
        
        arrays: Array<number[]> = new Array<number[]>();
        combiNumber: number;

        push(array: number[]) {
            this.arrays.push(array);
            this.indicesInArrays = [];
            for (var i = 0; i < this.arrays.length; i++) this.indicesInArrays.push(0);
            this.hadAll = false;
            this.combiNumber = 0;
        }

        getCurrent(): number[] {
            var indices = [];
            for (var i = 0; i < this.arrays.length; i++) {
                indices.push(this.arrays[i][this.indicesInArrays[i]]);
            }
            return indices;
        }

        hadAll: boolean = false;
        getNext(): Array<number> {

            if (this.hadAll || this.arrays.length == 0) return null;

            var arrayIndex = 0; // which of the arrays..
            for (; ;) {
                this.indicesInArrays[arrayIndex]++;
                if (this.indicesInArrays[arrayIndex] < this.arrays[arrayIndex].length) break;

                this.indicesInArrays[arrayIndex] = 0;
                arrayIndex++;
                if (arrayIndex >= this.arrays.length) {
                    this.hadAll = true;
                    return null;
                }
            }
            this.combiNumber++;
            return this.getCurrent();            
        }

        private indicesInArrays = [];

        // just for a quick check 
        logCombis() { // to do/ check: make sure first one is shown..
            var settings = [];
            for (; ;) {
                settings = this.getNext();

                if (settings == null) break;

                var str = "";
                for (var i = 0; i < settings.length; i++) {
                    str += settings[i] + " ";
                }
                console.debug(str);
            }
        }
    }

}