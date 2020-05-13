export { };

declare global {
    interface Window {
        requestAnimFrame: any;
    }
}

module CBD {


    /**
    * copied almost directly from Mersenne Twister implementation found in https://gist.github.com/banksean/300494
    * all rights reserved to him.
    */
    export class RNG {
        static N = 624;
        static M = 397;
        static MATRIX_A = 0x9908b0df;
        /* constant vector a */
        static UPPER_MASK = 0x80000000;
        /* most significant w-r bits */
        static LOWER_MASK = 0x7fffffff;
        /* least significant r bits */

        mt = new Array(RNG.N);
        /* the array for the state vector */
        mti = RNG.N + 1;
        /* mti==N+1 means mt[N] is not initialized */

        constructor(seed: number = null) {
            if (seed == null) {
                seed = new Date().getTime();
            }

            this.init_genrand(seed);
        }

        private init_genrand(s: number) {
            this.mt[0] = s >>> 0;
            for (this.mti = 1; this.mti < RNG.N; this.mti++) {
                var s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
                this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
                    + this.mti;
                /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
                /* In the previous versions, MSBs of the seed affect   */
                /* only MSBs of the array mt[].                        */
                /* 2002/01/09 modified by Makoto Matsumoto             */
                this.mt[this.mti] >>>= 0;
                /* for >32 bit machines */
            }
        }

        /**
         * generates a random number on [0,0xffffffff]-interval
         * @private
         */
        private _nextInt32(): number {
            var y: number;
            var mag01 = new Array(0x0, RNG.MATRIX_A);
            /* mag01[x] = x * MATRIX_A  for x=0,1 */

            if (this.mti >= RNG.N) { /* generate N words at one time */
                var kk: number;

                if (this.mti == RNG.N + 1)   /* if init_genrand() has not been called, */
                    this.init_genrand(5489);
                /* a default initial seed is used */

                for (kk = 0; kk < RNG.N - RNG.M; kk++) {
                    y = (this.mt[kk] & RNG.UPPER_MASK) | (this.mt[kk + 1] & RNG.LOWER_MASK);
                    this.mt[kk] = this.mt[kk + RNG.M] ^ (y >>> 1) ^ mag01[y & 0x1];
                }
                for (; kk < RNG.N - 1; kk++) {
                    y = (this.mt[kk] & RNG.UPPER_MASK) | (this.mt[kk + 1] & RNG.LOWER_MASK);
                    this.mt[kk] = this.mt[kk + (RNG.M - RNG.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
                }
                y = (this.mt[RNG.N - 1] & RNG.UPPER_MASK) | (this.mt[0] & RNG.LOWER_MASK);
                this.mt[RNG.N - 1] = this.mt[RNG.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

                this.mti = 0;
            }

            y = this.mt[this.mti++];

            /* Tempering */
            y ^= (y >>> 11);
            y ^= (y << 7) & 0x9d2c5680;
            y ^= (y << 15) & 0xefc60000;
            y ^= (y >>> 18);

            return y >>> 0;
        }

        /**
         * generates an int32 pseudo random number
         * @param range: an optional [from, to] range, if not specified the result will be in range [0,0xffffffff]
         * @return {number}
         */
        nextInt32(range: [number, number] = null): number {
            var result = this._nextInt32();
            if (range == null) {
                return result;
            }

            return (result % (range[1] - range[0])) + range[0];
        }

        /**
         * generates a random number on [0,0x7fffffff]-interval
         */
        nextInt31(): number {
            return (this._nextInt32() >>> 1);
        }

        /**
         * generates a random number on [0,1]-real-interval
         */
        nextNumber(): number {
            return this._nextInt32() * (1.0 / 4294967295.0);
        }

        /**
         * generates a random number on [0,1) with 53-bit resolution
         */
        nextNumber53(): number {
            var a = this._nextInt32() >>> 5, b = this._nextInt32() >>> 6;
            return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
        }
    }

    export class CBDGlobal {

        static MovementSpeed: number = 15;
        static NumberOfTicksPerGUIUpdate: number = 1;
        static TicksPerHour: number = 10;
        static TicksPerDay: number = CBDGlobal.TicksPerHour * 24;
        static PerishTime: number = 12 * CBDGlobal.TicksPerDay;
        static RecoveryTime: number = 14 * CBDGlobal.TicksPerDay;
    }

    enum LocationType { HOME, OFFICE, SCHOOL, VISIT, RESTAURANT, GRAVEYARD }

    export class Location {
        type: LocationType;
        label: string;

        left: number;
        right: number;
        top: number;
        bottom: number;

        GetMidX(): number { return (this.left + this.right) / 2; }
        GetMidY(): number { return (this.top + this.bottom) / 2; }
    }


    export class Appointment {
        location: Location;
        begin: number;
        duration: number;
    }
    
    export class Agenda {
        appointments = new Array<Appointment>();

        GetCurrentAppointment(t: number): Appointment {
            var sum = 0;
            for (var app of this.appointments) {
                sum += app.duration;
            }
            var restt = t % sum;
            var curapp = this.appointments[0];
            for (var app of this.appointments) {
                if (restt >= app.begin && restt < app.begin + app.duration) {
                    curapp = app;
                    break;
                }
            }
            return curapp;
        }
    }

    enum InfectionState { SUSCEPTIBLE, INFECTED_NOSYMPTOMS, INFECTED_SLIGHTSYMPTOMS, INFECTED_ILL, INFECTED_SEVERELYILL, RECOVERED, DECEASED }

    enum MovementState { MOVING, STAYING }

    export class Agent {
        id: string;
        agenda: Agenda;

        infectionState: InfectionState;
        timeOfInfection: number;
        age: number;
        house: Location;

        currentAppointment: Appointment = null;
        destination: Location = null;

        x: number;
        y: number;
        movementState: MovementState;
        
        size: number;

        draw(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
            ctx.fillStyle = Agent.GetColor(this.infectionState);
            ctx.fill();
            if (this.movementState == MovementState.STAYING) {
                ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
                ctx.strokeStyle = '0x000000';
                ctx.stroke(); // MovementState.MOVING
            }
        }

        static GetColor(state: InfectionState): string {
            var color = '#000000';
            switch (state) {
                case InfectionState.SUSCEPTIBLE: color = '#00ff00'; break;
                case InfectionState.INFECTED_NOSYMPTOMS: color = '#ff9999'; break;
                case InfectionState.INFECTED_SLIGHTSYMPTOMS: color = '#ff5555'; break;
                case InfectionState.INFECTED_ILL: color = '#ff0000'; break;
                case InfectionState.INFECTED_SEVERELYILL: color = '#6600ff'; break;
                case InfectionState.DECEASED: color = '#669999'; break;
                case InfectionState.RECOVERED: color = '#0066ff'; break;
            }
            return color;
        }

        getColor(): string {
            return Agent.GetColor(this.infectionState);
        }

        xdirection: number;
        ydirection: number;

        changeposition(scale: number, xdest: number, ydest: number) {

            this.xdirection = (xdest - this.x);
            this.ydirection = (ydest - this.y);
            var l = Math.sqrt(this.xdirection * this.xdirection + this.ydirection * this.ydirection);
            if (l <= scale) {
                this.xdirection = 0;
                this.ydirection = 0;
                this.x = xdest;
                this.y = ydest;
                return;
            }
            this.xdirection /= l;
            this.ydirection /= l;
            this.xdirection *= scale;
            this.ydirection *= scale;
        }

        mortalityratebyage = [[80, 14.8], [70, 8.0], [60, 3.6], [50, 1.3], [40, 0.4], [30, 0.2], [20, 0.2], [10, 0.2], [0, 0]];

        mortalityratebyageperpertick(): number {
            // https://www.worldometers.info/coronavirus/coronavirus-age-sex-demographics/  retrieved 19 March 2020 14:28 CET
            // 80+ years old   14.8%
            // 70-79 years old 8.0%
            // 60-69 years old 3.6%
            // 50-59 years old 1.3%
            // 40-49 years old 0.4%
            // 30-39 years old 0.2%
            // 20-29 years old 0.2%
            // 10-19 years old 0.2%
            // 0-9 years old    0%

            var mortalityrate = 0;
            for (var i = 0; i < this.mortalityratebyage.length; i++) {
                if (this.age > this.mortalityratebyage[i][0]) {
                    mortalityrate = this.mortalityratebyage[i][1]/100;
                    break;
                }
            }

            var survivalrate = 1 - mortalityrate;
            var nr = (CBDGlobal.RecoveryTime - CBDGlobal.PerishTime);// * CBDGlobal.TicksPerDay;
            return 1 - Math.pow(survivalrate, 1/nr);
        }


        step(t: number, width: number, height: number, rng: RNG, blockSchool: boolean, officePolicy: OfficePolicy) {

            if (this.infectionState == InfectionState.DECEASED) return;
            if (this.infectionState == InfectionState.INFECTED_SEVERELYILL &&
                this.movementState == MovementState.STAYING) {
                return;
            }

            var appointment = this.agenda.GetCurrentAppointment(t);

            var bInfected: boolean = (this.infectionState == InfectionState.INFECTED_SLIGHTSYMPTOMS ||
                this.infectionState == InfectionState.INFECTED_ILL ||
                this.infectionState == InfectionState.INFECTED_SEVERELYILL);
            
            if ( // case 1: stay home when ill
                (bInfected && ((appointment.location.label == "school" && blockSchool) || (appointment.location.label == "office" && officePolicy != OfficePolicy.STAYHOMEALWAYS)))
                    ||
                    // case 2: always work from home..
                (appointment.location.label == "office" && officePolicy == OfficePolicy.STAYHOMEALWAYS)
                )
            {
                appointment = this.currentAppointment = new Appointment();
                this.currentAppointment.begin = t;
                this.currentAppointment.duration = -1;
                this.destination = this.currentAppointment.location = this.house;
            }

            if (this.currentAppointment == null) {
                this.currentAppointment = appointment;
                this.movementState = MovementState.STAYING;
                this.destination = this.currentAppointment.location;
                this.x = this.destination.left + this.size + (this.destination.right - this.destination.left - 2 * this.size) * rng.nextNumber();
                this.y = this.destination.top + this.size + (this.destination.bottom - this.destination.top - 2 * this.size) * rng.nextNumber();

                var theta = rng.nextNumber() * 2 * Math.PI;
                this.xdirection = Math.sin(theta);
                this.ydirection = Math.cos(theta);
            }
            else if (appointment != this.currentAppointment) {
                this.currentAppointment = appointment;
                this.movementState = MovementState.MOVING;
                this.destination = this.currentAppointment.location;
            }

            if (this.movementState == MovementState.STAYING) {
                // move within location..

                this.x += this.xdirection;
                if (this.x > this.destination.right - this.size ||
                    this.x < this.destination.left + this.size) {
                    this.xdirection *= -1;
                    this.x = Math.max(this.destination.left + this.size, Math.min(this.x, this.destination.right - this.size));
                }

                this.y += this.ydirection;
                if (this.y > this.destination.bottom - this.size ||
                    this.y < this.destination.top + this.size) {
                    this.ydirection *= -1;
                    this.y = Math.max(this.destination.top + this.size, Math.min(this.y, this.destination.bottom - this.size));
                }
            }
            else {
                // head in the right direction
                this.x = (this.x + this.xdirection + width) % width;
                this.y = (this.y + this.ydirection + height) % height;

                this.changeposition(CBDGlobal.MovementSpeed, this.destination.GetMidX(), this.destination.GetMidY());

                // if entering the destination, change state to 'staying'
                if ((this.x >= this.destination.left + this.size && this.x <= this.destination.right - this.size) &&
                    (this.y >= this.destination.top + this.size && this.y <= this.destination.bottom - this.size)) {
                    this.movementState = MovementState.STAYING;
                    var theta = rng.nextNumber() * 2 * Math.PI;
                    this.xdirection = Math.sin(theta);
                    this.ydirection = Math.cos(theta);
                }
            }
        }

        // enum InfectionState { SUSCEPTIBLE, INFECTED_NOSYMPTOMS, INFECTED_SLIGHTSYMPTOMS, INFECTED_ILL, INFECTED_SEVERELYILL, RECOVERED, DECEASED }

        //
        //                                                        +---------------------------------+
        //                                                        |                                \|/
        // SUSCEPTIBLE EXPOSED - latency -> INFECTIOUS - Pis -> SEVERE - Psc -> CRITICAL - Pcr -> RECOVERY
        //                                                                        |
        //                                                                        +------ f * Pcd -> DECEASED



        // unlike metapopulation models, the infection (i.e. the transition from susceptible to being infected) occurs by explicit social interaction in physical proximity
        progress(time: number, recoveryTime: number, incubationPeriod: number, fullSymptomsPeriod: number, perishTime: number, rng: RNG) {

            if (this.infectionState == InfectionState.DECEASED || this.infectionState == InfectionState.SUSCEPTIBLE || this.infectionState == InfectionState.RECOVERED) return;

            if (this.infectionState == InfectionState.INFECTED_SEVERELYILL) {
                if (this.currentAppointment.location != this.house) {
                    this.movementState = MovementState.MOVING;
                    this.destination = this.house;
                    return;
                }
            }

            //if (this.state == InfectionState.INFECTEDAWARE || this.state == InfectionState.INFECTEDUNAWARE) {
            var delta = (time - this.timeOfInfection);
            if (delta >= recoveryTime) {
                this.infectionState = InfectionState.RECOVERED;
            }
            else if (delta >= incubationPeriod && this.infectionState == InfectionState.INFECTED_NOSYMPTOMS) {
                this.infectionState = InfectionState.INFECTED_SLIGHTSYMPTOMS;
            }
            else if (delta >= fullSymptomsPeriod && this.infectionState == InfectionState.INFECTED_SLIGHTSYMPTOMS) {
                this.infectionState = InfectionState.INFECTED_ILL;
            }
            else if (delta >= fullSymptomsPeriod && this.infectionState == InfectionState.INFECTED_ILL) {
                if (this.age > 20) {
                    if (rng.nextNumber() < 0.05) {
                        this.infectionState = InfectionState.INFECTED_SEVERELYILL;
                    }
                }
            }
            else if (this.infectionState == InfectionState.INFECTED_SEVERELYILL && delta >= perishTime) {
                var mortalityrate = this.mortalityratebyageperpertick();
                if (rng.nextNumber() < mortalityrate) {
                    this.infectionState = InfectionState.DECEASED;
                }
            }
        }

        contaminate(agents: Array<Agent>, infectionDistance: number, time: number, rng: RNG) {
            if (this.infectionState == InfectionState.DECEASED || this.infectionState == InfectionState.SUSCEPTIBLE || this.infectionState == InfectionState.RECOVERED) return;

            // symptoms are not showing, so no infection takes place, by assumption..
            if (this.infectionState == InfectionState.INFECTED_NOSYMPTOMS) return; 

            // for the moment assume that agents are not infecting other agents when moving (e.g. they are sitting in their own private cars..)
            if (this.movementState == MovementState.MOVING) return;

            // Here, the agent is infected and is showing symptoms, so may infect another agent..
            for (let a of agents) {
                if (a.movementState == MovementState.MOVING) continue;
                if (a.id == this.id) continue;
                
                var dx = a.x - this.x;
                var dy = a.y - this.y;
                if (dx * dx + dy * dy < infectionDistance * infectionDistance) {
                    if (a.infectionState == InfectionState.SUSCEPTIBLE) {

                        var drw = rng.nextNumber();
                        if (this.infectionState == InfectionState.INFECTED_SLIGHTSYMPTOMS && drw < 0.10) {
                            a.infectionState = InfectionState.INFECTED_NOSYMPTOMS;
                            a.timeOfInfection = time;
                        }
                        else if (this.infectionState == InfectionState.INFECTED_ILL && drw < 0.20) {
                            a.infectionState = InfectionState.INFECTED_NOSYMPTOMS;
                            a.timeOfInfection = time;
                        }
                        else if (this.infectionState == InfectionState.INFECTED_SEVERELYILL && drw < 0.30 && this.currentAppointment.location.label != "hospital") {
                            a.infectionState = InfectionState.INFECTED_NOSYMPTOMS;
                            a.timeOfInfection = time;
                        }
                    }
                }
            }
        }
    }

    export class Statistics {
        nrUninfected: number = 0;
        nrInfectedNoSymptoms: number = 0;
        nrInfectedSlightSymptoms: number = 0;
        nrInfectedIll: number = 0;
        nrInfectedSeverelyIll: number = 0;
        nrDeceased: number = 0;
        nrRecovered: number = 0;
    }

    enum HouseholdType {
        THREEGENERATION,
        SINGLE,
        COUPLE,
        COUPLEWITHCHILDREN,
        SINGLEWITHCHILDREN
    }

    enum OfficePolicy { COMEALWAYS, STAYHOMEWHENSICK, STAYHOMEALWAYS }

    export class World {

        ctx: CanvasRenderingContext2D;
        rng: RNG;
        time: number; 

        constructor() { }

        graveyard: Location;

     

        init(context: CanvasRenderingContext2D) {
            this.agents = new Array<Agent>();
            this.locations = new Array<Location>();
            this.ctx = context;
            this.rng = new RNG(11);
            this.time = 0;
            var width = this.ctx.canvas.width;
            var height = this.ctx.canvas.height;
            var sz = 5;

            this.graveyard = new Location(); // graveyard
            this.graveyard.label = "graveyard";
            this.graveyard.type = LocationType.GRAVEYARD;
            this.graveyard.left = width - 100;
            this.graveyard.right = width - 20;
            this.graveyard.top = height - 100;
            this.graveyard.bottom = height - 20;
            this.locations.push(this.graveyard);

            var scl = new Location(); // school
            scl.label = "school";
            scl.type = LocationType.SCHOOL;
            scl.left = width - 100;
            scl.right = width - 20;
            scl.top = height - 200;
            scl.bottom = height - 120;
            this.locations.push(scl);

            var nrhouseholds = 50;
            var nrOffices = 15;

            var offices = new Array<Location>();
            for (var h = 0; h < nrOffices; h++) {
                var r = 0; var nrperrow = 4;
                var c = 0; 

                var officeSz = 50;
                var loc = new Location();
                loc.label = "office"; // + h;
                loc.top = height - 20 - officeSz - 60 * Math.trunc(h / nrperrow);
                loc.left = 20 + 60 * (h % nrperrow);
                loc.right = loc.left + officeSz;
                loc.bottom = loc.top + officeSz;
                loc.type = LocationType.OFFICE;

                offices.push(loc);
                this.locations.push(loc);
            }

            
            var n = 0;
            for (var h = 0; h < nrhouseholds; h++) {

                // https://population.un.org/Household/index.html#/countries/380
                // italy avg household size = 2.4
                // % household with at least one <20 = 29%
                // % household with at least one >65
                // % household with one <20 & one >65 = 2%
                // three generation household 3%

                var nrInHousehold = 4;
                var HH = HouseholdType.SINGLE; // IPUMS 2001: 25 single - 19 couple only - 40 couple with children - 8 single parent with childern - 8 extended family
                var db = this.rng.nextNumber();
                if (db < 0.25) {
                    HH = HouseholdType.SINGLE;
                } else if (db < 0.44) {
                    HH = HouseholdType.COUPLE;
                } else if (db < 0.84) {
                    HH = HouseholdType.COUPLEWITHCHILDREN;
                    nrInHousehold = 4;
                    if (this.rng.nextNumber() > 0.4) // not sure..
                        nrInHousehold = 3;
                } else if (db < 0.92) {
                    HH = HouseholdType.SINGLEWITHCHILDREN;
                    nrInHousehold = 3;
                    if (this.rng.nextNumber() > 0.4) // not sure..
                        nrInHousehold = 2;
                }
                else {
                    HH = HouseholdType.THREEGENERATION;
                    nrInHousehold = 4;
                }

                var r = 0; var nrperrow = 10;
                var c = 0; 

                var loc = new Location();
                loc.label = "H" + h;
                loc.top = 20 + 40 * Math.trunc(h / nrperrow);
                loc.left = 20 + 40 * (h % nrperrow);
                loc.right = loc.left + 30;
                loc.bottom = loc.top + 30;
                loc.type = LocationType.HOME;

                this.locations.push(loc);

                for (var k = 0; k < nrInHousehold; k++) {
                    var a = new Agent();
                    
                    a.house = loc;
                    a.id = "id " + n++;
                    a.infectionState = InfectionState.SUSCEPTIBLE;
                    a.size = sz;

                    if (HH == HouseholdType.THREEGENERATION) {
                        if (k == 0 || k == 1) a.age = 45;
                        if (k == 2) a.age = 10;
                        if (k == 3) a.age = 80;
                    } else if (HH == HouseholdType.SINGLEWITHCHILDREN) {
                        a.age = 10;
                        if (k == 0) a.age = 45;
                    } else if (HH == HouseholdType.COUPLEWITHCHILDREN) {
                        a.age = 10;
                        if (k == 0 || k == 1) a.age = 45;
                    } else if (HH == HouseholdType.COUPLE) {
                        a.age = 45;
                    }

                    a.agenda = new Agenda();
                    
                    if (a.age > 60) {
                        var appHome = new Appointment(); appHome.begin = 0; appHome.duration = 24 * CBDGlobal.TicksPerHour; appHome.location = loc;
                        a.agenda.appointments.push(appHome);
                    }
                    else if (a.age > 20) {
                        var appHome = new Appointment(); appHome.begin = 0; appHome.duration = 14 * CBDGlobal.TicksPerHour; appHome.location = loc;
                        a.agenda.appointments.push(appHome);
                        var appWerk = new Appointment();
                        appWerk.begin = appHome.begin + appHome.duration;
                        appWerk.duration = 10 * CBDGlobal.TicksPerHour;
                        appWerk.location = offices[this.rng.nextInt32([0, offices.length])];
                        a.agenda.appointments.push(appWerk);
                    }
                    else {
                        var appHome = new Appointment(); appHome.begin = 0; appHome.duration = 13 * CBDGlobal.TicksPerHour; appHome.location = loc;
                        a.agenda.appointments.push(appHome);
                        var appSchool = new Appointment(); appSchool.begin = appHome.begin + appHome.duration; appSchool.duration = 11 * CBDGlobal.TicksPerHour; appSchool.location = scl;
                        a.agenda.appointments.push(appSchool);
                    }

                    a.x = this.rng.nextInt32([sz, width - sz]);
                    a.y = this.rng.nextInt32([sz, height - sz]);

                    a.xdirection = 2 * this.rng.nextNumber() - 1;
                    a.ydirection = 2 * this.rng.nextNumber() - 1;
                    this.agents.push(a);

                }
            }
            this.agents[0].infectionState = InfectionState.INFECTED_NOSYMPTOMS;
            this.agents[0].timeOfInfection = 0;
        }

        agents = new Array<Agent>();

        draw() {
            for (var a of this.agents)
            {
                if (a.infectionState == InfectionState.DECEASED) continue;
                a.draw(this.ctx);
            }
            var deadAgents = this.agents.filter(zz => zz.infectionState == InfectionState.DECEASED);

            var margin = 5;
            var gravemargin = 2;
            var gravewidth = 6;
            var graveheight = 6;
            var gyw = this.graveyard.right - this.graveyard.left - 2 * margin;
            for (var i = 0; i < deadAgents.length; i++) {
                
                var c = margin - gravemargin + (gravemargin + gravewidth) * (i % 8);
                var r = margin - gravemargin + (gravemargin + graveheight) * Math.trunc(i / 8);
                this.ctx.beginPath();
                this.ctx.arc(this.graveyard.left + c + gravewidth / 2, this.graveyard.top + r + graveheight / 2, gravewidth * 0.4, 0, 2 * Math.PI);
                this.ctx.fillStyle = deadAgents[i].getColor();
                this.ctx.fill();
            }
        }

        policySchoolBarsSick = false;
        policyKeepDistance = false;
                
        policyOffice: OfficePolicy;
        setOfficePolicy(value: string) {
            this.policyOffice = OfficePolicy.COMEALWAYS;
            switch (value) {
                case "stayhomewhensick": this.policyOffice = OfficePolicy.STAYHOMEWHENSICK; break;
                case "workfromhome": this.policyOffice = OfficePolicy.STAYHOMEALWAYS; break;
                default:
                case "come": this.policyOffice = OfficePolicy.COMEALWAYS; break;
            }   
        }

        step() {
            
            var w = this.ctx.canvas.width;
            var h = this.ctx.canvas.height;

            for (var a of this.agents) {
                a.step(this.time, w, h, this.rng, this.policySchoolBarsSick, this.policyOffice);
            }

            for (var a of this.agents) {
                a.progress(this.time, CBDGlobal.RecoveryTime, 5 * CBDGlobal.TicksPerDay, 8 * CBDGlobal.TicksPerDay, 12 * CBDGlobal.TicksPerDay, this.rng);
                a.contaminate(this.agents, 3, this.time, this.rng);
            }

            this.time++;
        }

        clear() {
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fill();
            //this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        drawBox() {
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.strokeStyle = '#202020';
            this.ctx.stroke();
        }

        locations: Array<Location>;

        drawLocations() {
            for (var l of this.locations) {
                this.ctx.beginPath();
                this.ctx.rect(l.left, l.top, l.right - l.left, l.bottom - l.top);

                var color = '#e0e0e0';
                switch (l.type) {
                    case LocationType.GRAVEYARD: color = '#CDCDCD'; break;
                    case LocationType.HOME: color = '#FFFF01'; break;
                    case LocationType.RESTAURANT: color = '#FF6922'; break;
                    case LocationType.SCHOOL: color = '#DA9B78'; break;
                    case LocationType.OFFICE: color = '#EAC3D6'; break;
                    case LocationType.VISIT: color = '#000000'; break;
                }
                this.ctx.fillStyle = color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }

        getStatistics(): Statistics {
            var s = new Statistics();
            for (var a of this.agents) {
                switch (a.infectionState) {
                    case InfectionState.SUSCEPTIBLE: s.nrUninfected++; break;
                    case InfectionState.INFECTED_NOSYMPTOMS: s.nrInfectedNoSymptoms++; break;
                    case InfectionState.INFECTED_SLIGHTSYMPTOMS: s.nrInfectedSlightSymptoms++; break;
                    case InfectionState.INFECTED_ILL: s.nrInfectedIll++; break;
                    case InfectionState.INFECTED_SEVERELYILL: s.nrInfectedSeverelyIll++; break;
                    case InfectionState.RECOVERED: s.nrRecovered++; break;
                    case InfectionState.DECEASED: s.nrDeceased++; break;
                }
            }
            return s;
        }
    }


    export class Point { t: number; value: number; }
    export class Coordinate { x: number; y: number; }

    export class Curve { points: Array<Point>; label: string; color: string; }

    type CallbackGetColorByLabel = (label: string) => string;

    class Graph {
        constructor(htmlElement: string) {
            var canvas = <HTMLCanvasElement>document.getElementById(htmlElement);
            this.ctx = canvas.getContext("2d");
        }
        ctx: CanvasRenderingContext2D;

        curves: Array<Curve>;

        getColorByLabel: CallbackGetColorByLabel;

        init(callbackGetColorByLabel: CallbackGetColorByLabel) {
            this.getColorByLabel = callbackGetColorByLabel;
            this.curves = new Array<Curve>();
            this.valueMax = 1;
            this.tMax = 1;
            this.xOffset = 10;
            this.yOffset = 10;
        }

        valueMax: number;
        tMax: number;
        xScale: number;
        xOffset: number;
        yScale: number;
        yOffset: number;

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
            if (value > this.valueMax) this.valueMax = value;
        }

        D2Sc(t: number, value: number): Coordinate {
            var c = new Coordinate();
            c.x = this.xOffset + this.xScale * (t - 0); // / (this.tMax - 0);
            c.y = this.ctx.canvas.height - this.yOffset - this.yScale * (value - 0); // / (this.valueMax - 0);
            return c;
        }

        clear() {
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.fillStyle = '#f8f8f8';
            this.ctx.fill();
        }

        draw() {
            this.clear();
            this.xScale = (this.ctx.canvas.width - 2 * this.xOffset) / (this.tMax - 0);
            this.yScale = (this.ctx.canvas.height - 2 * this.yOffset) / (this.valueMax - 0);

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

            // draw axes
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.moveTo(this.xOffset, this.ctx.canvas.height - this.yOffset);
            this.ctx.lineTo(this.xOffset, this.yOffset);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.xOffset, this.ctx.canvas.height - this.yOffset);
            this.ctx.lineTo(this.ctx.canvas.width - this.xOffset, this.ctx.canvas.height - this.yOffset);
            this.ctx.stroke();
        }
    }

    class Stack {
        t: number;
        values: number[];
    }

    class StackedGraph {
        constructor(htmlElement: string) {
            var canvas = <HTMLCanvasElement>document.getElementById(htmlElement);
            this.ctx = canvas.getContext("2d");
        }
        ctx: CanvasRenderingContext2D;
        colors: string[];

        init() {
            this.valueMax = 1;
            this.tMax = 1;
            this.xOffset = 10;
            this.yOffset = 10;
            this.nrInStack = -1;
            this.stacks = new Array<Stack>();
        }

        valueMax: number;
        tMax: number;
        xScale: number;
        xOffset: number;
        yScale: number;
        yOffset: number;

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
            if (values.length > this.colors.length)
            {
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

        D2Sc(t: number, value: number): Coordinate {
            var c = new Coordinate();
            c.x = this.xOffset + this.xScale * (t - 0); // / (this.tMax - 0);
            c.y = this.ctx.canvas.height - this.yOffset - this.yScale * (value - 0); // / (this.valueMax - 0);
            return c;
        }

        clear() {
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.fillStyle = '#f8f8f8';
            this.ctx.fill();
        }

        stacks: Array<Stack> = [];

        draw(logarithmic: boolean = false, cumulative: boolean = false) {
            this.clear();

            if (this.nrInStack > 0 && this.stacks.length > 0) {

                this.xScale = (this.ctx.canvas.width - 2 * this.xOffset) / (this.tMax - 0);
                this.yScale = (this.ctx.canvas.height - 2 * this.yOffset) / (this.valueMax - 0);
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

                for (var p = 0; p < polygons.length; p++) {
                    var polygon = polygons[p];

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

            // draw axes
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.moveTo(this.xOffset, this.ctx.canvas.height - this.yOffset);
            this.ctx.lineTo(this.xOffset, this.yOffset);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.xOffset, this.ctx.canvas.height - this.yOffset);
            this.ctx.lineTo(this.ctx.canvas.width - this.xOffset, this.ctx.canvas.height - this.yOffset);
            this.ctx.stroke();
        }
    }

    export class Simulation {

        LabelToColor(label: string): string {
            var state = InfectionState.SUSCEPTIBLE;
            switch (label) {
                case "preinfection": state = InfectionState.SUSCEPTIBLE; break;
                case "infectednosymptoms": state = InfectionState.INFECTED_NOSYMPTOMS; break;
                case "slightsymptoms": state = InfectionState.INFECTED_SLIGHTSYMPTOMS; break;
                case "ill": state = InfectionState.INFECTED_ILL; break;
                case "severelyill": state = InfectionState.INFECTED_SEVERELYILL; break;
                case "recovered": state = InfectionState.RECOVERED; break;
                case "deceased": state = InfectionState.DECEASED; break;
                default: alert("Undefined label for color: " + label); break;
            }
            return Agent.GetColor(state);
        }

        constructor() {
            // populate world with agents
            //  - generate agendas
            //  - 

            var canvas = <HTMLCanvasElement>document.getElementById("worldcanvas");
            var ctx = canvas.getContext("2d");

            //var grcanvas = <HTMLCanvasElement>document.getElementById();
            this.graph = new StackedGraph("graph");
            this.graph.init();

            this.world = new World();
            this.world.init(ctx);

            let cbSchool = document.getElementById("policy_schoolbarssick") as HTMLInputElement;
            cbSchool.addEventListener("click", (e: Event) => { this.world.policySchoolBarsSick = cbSchool.checked; });

            //let cbOffice = document.getElementById("policy_office_come") as HTMLInputElement;

            var fie = (e: Event) => {
                this.world.setOfficePolicy((<HTMLInputElement>document.querySelector('input[name="policy_office"]:checked')).value);
                this.world.policyOffice = OfficePolicy.COMEALWAYS;
            }

            document.getElementById("policy_office_come").addEventListener("click", fie);
            document.getElementById("policy_office_stayhomewhensick").addEventListener("click", fie);
            document.getElementById("policy_office_workfromhome").addEventListener("click", fie);

            let cbDistance = document.getElementById("policy_keepdistance") as HTMLInputElement;
            cbDistance.addEventListener("click", (e: Event) => { this.world.policyKeepDistance = cbDistance.checked; });

            let rSpeed = document.getElementById("simulationspeed") as HTMLInputElement;
            rSpeed.addEventListener("click", (e: Event) => {
                this.simulationSpeed = +rSpeed.value;
            });

            let btn = document.getElementById("restart");
            btn.addEventListener("click", (e: Event) => {
                this.world.init(ctx);
                this.world.policySchoolBarsSick = cbSchool.checked;
                if ((<HTMLInputElement>document.getElementById("policy_office_come")).checked) this.world.policyOffice = OfficePolicy.COMEALWAYS;
                if ((<HTMLInputElement>document.getElementById("policy_office_stayhomewhensick")).checked) this.world.policyOffice = OfficePolicy.STAYHOMEWHENSICK;
                if ((<HTMLInputElement>document.getElementById("policy_office_workfromhome")).checked) this.world.policyOffice = OfficePolicy.STAYHOMEALWAYS;

                this.graph.init();
            });

        }

        simulationSpeed: number = CBDGlobal.NumberOfTicksPerGUIUpdate;

        draw() {
            this.world.clear();
            this.world.drawLocations();
            this.world.draw();
            this.world.drawBox();

            this.graph.colors = [
                this.LabelToColor("preinfection"),
                this.LabelToColor("infectednosymptoms"),
                this.LabelToColor("slightsymptoms"),
                this.LabelToColor("ill"),
            //    this.LabelToColor("recovered"),
              //  this.LabelToColor("deceased"),
                this.LabelToColor("severelyill")].reverse();
            for (var n = 0; n < this.simulationSpeed; n++) {

                if (0 == (this.world.time % CBDGlobal.TicksPerDay)) {
                    var stats = this.world.getStatistics();
                    this.graph.push(this.world.time, [stats.nrUninfected, stats.nrInfectedNoSymptoms, stats.nrInfectedSlightSymptoms, stats.nrInfectedIll,
                        //stats.nrRecovered, stats.nrDeceased,
                        stats.nrInfectedSeverelyIll].reverse());
                    this.graph.draw();
                }
            
                this.world.step();
            }
            window.requestAnimationFrame(() => this.draw());
        }

        world: World;
        graph: StackedGraph;
    }
}

window.onload = () => {
        var simulation = new CBD.Simulation();
        simulation.draw();
};


