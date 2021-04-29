/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {


    class LaborOutput {
        deltaTime: number = 0;
        fractionEffective: number = 0;
    }

    enum LaborEffectiveness { ZERO, SEVENTYFIVE, HUNDRED, HUNDREDFIFTY } // factory worker would be zero, regular knowledge worker seventyfive (e.g. when children are around), 

export class Agent {
    id: string;
    agenda: Agenda;

    R0_NrInfected: number = 0;
    R0_NrContacts: number = 0;
    
    family: Array<Agent>;
    infectionState: InfectionState;
    timeE: number;

    vaccinate(time: number) {
        //console.log("Vaccinate " + this.id);

        if (this.infectionState == InfectionState.VACCINATED) {
            alert("Already vaccinated!");
            return;
        }
        if (this.infectionState != InfectionState.SUSCEPTIBLE) {
            alert("Agent not in susceptible state, so e.g. already infected!");
            return;
        }
        this.infectionState = InfectionState.VACCINATED;
        if (this.diseaseHistory == null)
            this.diseaseHistory = [];
        this.diseaseHistory.push("" + time + " VACCINATED");
    }

    expose(time: number, rng: RNG, incd: number = null) {
        if (this.infectionState == InfectionState.VACCINATED) {
            alert("Vaccinated!");
            return;
        }

        this.infectionState = InfectionState.EXPOSED_LATENT;
        this.diseaseHistory = [];
        this.diseaseHistory.push("" + time + " exposed, latent");

        var incdrw = rng.nextNumber();
        this.timeE = time;
        if (incd == null)
            this.timeEI_Tot = this.timeE + this.incubationdistribution.findIndex(zz => zz >= incdrw) * CBDGlobal.TicksPerDay; // if agent has just been exposed draw the incubation period from the lognormal discretization distribution
        else
            this.timeEI_Tot = this.timeE + incd * CBDGlobal.TicksPerDay;
        this.timeEI_L = Math.max(0, this.timeEI_Tot - this.durPresymptomatic * CBDGlobal.TicksPerDay); // p.i.t. either
        this.timeIS = this.timeEI_Tot + this.gateIS * CBDGlobal.TicksPerDay; // p.i.t. become severe after infectious
        this.timeIR = this.timeEI_Tot + this.gateIR * CBDGlobal.TicksPerDay; // p.i.t. recovering after infection (if not becoming severe)
        this.timeSC = this.timeIS + this.gateSC * CBDGlobal.TicksPerDay; // p.i.t. moving to critical after severe
        this.timeSR = this.timeIS + this.gateSR * CBDGlobal.TicksPerDay; // p.i.t. for recovery after severe, if not becoming critical
        this.timeCDorR = this.timeSC + this.gateCDorR * CBDGlobal.TicksPerDay; // p.i.t. die/ recover if critical
        //console.debug("Agent " + this.id + " exposed " + time + " / " + this.timeEI_Tot + " ( " + this.timeEI_L + " ) " + this.timeIS + " < " + this.timeIR + " / " + this.timeSC + " < " + this.timeSR + " / " + this.timeCDorR);
        /*console.debug("" + this.id + "\t"
            + (this.timeEI_Tot - time) / CBDGlobal.TicksPerDay + "\t"
            + (this.timeEI_Tot - this.timeEI_L) / CBDGlobal.TicksPerDay + "\t"
            + (this.timeEI_L - time) / CBDGlobal.TicksPerDay + "\t" //
            + (this.timeIS - this.timeEI_Tot) / CBDGlobal.TicksPerDay + "\t" // 4
            + (this.timeIR - this.timeEI_Tot) / CBDGlobal.TicksPerDay + "\t" // 9
            + (this.timeSC - this.timeIS) / CBDGlobal.TicksPerDay + "\t" // 1
            + (this.timeSR - this.timeIS) / CBDGlobal.TicksPerDay + "\t" // 14
            + (this.timeCDorR - this.timeSC) / CBDGlobal.TicksPerDay // 10
        );*/
    }

    timeEI_Tot: number;
    timeEI_L: number;

    readonly durPresymptomatic = 1;
    readonly gateIS: number = 4;
    readonly gateIR: number = 9; // An der Heiden & Bochholz
    gateISPassed: boolean = false;
    timeIS: number;
    timeIR: number;

    readonly gateSC: number = 1;
    readonly gateSR: number = 14;
    gateSCPassed: boolean = false;
    timeSC: number;
    timeSR: number;

    readonly gateCDorR: number = 10;
    timeCDorR: number;

    age: number;
    householdtype: HouseholdType;
    house: Location;

    hospitals: Array<Hospital>;
    hospitalPick: Hospital;
    schoolNearestToHome: School;
    supermarketNearestToHome: Supermarket;
    recareaFavorite: RecreationArea;
    workingplace: Office;


    movementState: MovementState;
    locationDestination: Location = null; // use only when moving
    locationCurrent: Location = null;

    x: number;
    y: number;

    size: number = 2;

    draw(ctx: CanvasRenderingContext2D, time: number) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = Agent.GetColor(this.infectionState);
        ctx.fill();
        //if (this.movementState == MovementState.STAYING)
        {
            //   ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
            ctx.strokeStyle = '#000000';
            ctx.stroke(); // MovementState.MOVING
        }
    }

    static GetColor(state: InfectionState): string {
        var color = '#000000';
        switch (state) {
            case InfectionState.SUSCEPTIBLE: color = '#4cff00'; break;
            case InfectionState.EXPOSED_LATENT: color = '#ffE800'; break; // #ff9999
            case InfectionState.EXPOSED_PRESYMPTOMATIC: color = '#ffC800'; break; // #ff9999
            case InfectionState.INFECTED: color = '#ffa800'; break; // #ff5555
            case InfectionState.INFECTEDSEVERE: color = '#ff6a00'; break;
            case InfectionState.INFECTEDCRITICAL: color = '#ff0000'; break;
            case InfectionState.RECOVERED: color = '#b200ff'; break;
            case InfectionState.DECEASED: color = '#0026ff'; break;
            case InfectionState.VACCINATED: color = '#ffffff'; break;
            default:
                alert("Color for InfectionState not handled.");
                break;
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
    
    getNearestFreeHospital(): Hospital {
        var dist = Number.MAX_SAFE_INTEGER;
        var hh = null;
        for (var h of this.hospitals) {
            if (h.patients.length < h.nrBeds) {
                var dx = this.x - h.location.GetMidX();
                var dy = this.y - h.location.GetMidY();
                var dd = dx * dx + dy * dy;
                if (dd < dist) {
                    dist = dd;
                    hh = h;
                }
            }
        }

        return hh;
    }

    goHome() {
        if (this.locationCurrent.type == LocationType.HOME) return;
        this.locationDestination = this.house;
        this.movementState = MovementState.MOVING;
    }


    
    laborOutputs = new Array<LaborOutput>();
    currentLaborOutput = new LaborOutput();

    workHomeEffectiveness: LaborEffectiveness = LaborEffectiveness.SEVENTYFIVE;
    workHomeEffectivenessFactor = 0.75;
    effectiveLabor_LastTime: number = 0;
    
    addWorkingRate(time: number, appointmentType: AppointmentType) { // outputType: OutputType
        var delta = time - this.effectiveLabor_LastTime;
        this.currentLaborOutput.deltaTime += delta;
        this.effectiveLabor_LastTime = time;

        var mf = 1;
        switch (this.infectionState) {
            case InfectionState.DECEASED:
            case InfectionState.INFECTEDCRITICAL:
            case InfectionState.INFECTEDSEVERE: mf = 0; break;
            case InfectionState.INFECTED: mf = 0.75; break;
        }

        if (this.movementState == MovementState.MOVING) mf = 0;

        if (appointmentType == AppointmentType.WORK) {
            if (this.locationCurrent.type == LocationType.HOME) {
                mf *= this.workHomeEffectivenessFactor;
            }
        }
        else {
            mf = 0;
        }

        this.currentLaborOutput.fractionEffective += delta * mf;

        // Collect stats for the entire week
        if (this.currentLaborOutput.deltaTime > CBDGlobal.TicksPerDay * 7) {
            this.laborOutputs.push(this.currentLaborOutput);
            this.currentLaborOutput = new LaborOutput();
        }
    }

    // for reasons of computational speed, integrated the workoutput stats computation in the step function..
    step(t: number, width: number, height: number, rng: RNG,
        schoolPolicy: SchoolPolicy, officePolicy: OfficePolicy, hospitalPolicy: HospitalizationPolicy, gatheringPolicy: GatheringsPolicy) {
        
        if (this.infectionState == InfectionState.DECEASED) {
            this.addWorkingRate(t, null);
            return;
        }

        if (this.movementState == MovementState.MOVING) {
            this.updatePosition(width, height, 0.7, false, rng); // also updates location variables and resets movement state..
            this.addWorkingRate(t, null);
            return;
        }

        // not working, staying at home.. or going to hospital
        if (this.infectionState == InfectionState.INFECTEDCRITICAL || this.infectionState == InfectionState.INFECTEDSEVERE) {

            this.addWorkingRate(t, null); // appointment does not matter

            if ((hospitalPolicy == HospitalizationPolicy.CRITICAL && this.infectionState == InfectionState.INFECTEDCRITICAL) ||
                (hospitalPolicy == HospitalizationPolicy.SEVERE_AND_CRITICAL && (this.infectionState == InfectionState.INFECTEDCRITICAL || this.infectionState == InfectionState.INFECTEDSEVERE))) {

                if (this.hospitalPick == null) {
                    this.hospitalPick = this.getNearestFreeHospital();
                    if (this.hospitalPick != null) {

                        this.hospitalPick.patients.push(this);
                        this.movementState = MovementState.MOVING;
                        this.locationDestination = this.hospitalPick.location;
                    }
                    else {
                        this.goHome();
                    }
                }
                return;
            }
            this.updatePosition(width, height, 0.2, true, rng);
            return;
        }

        var appointment = this.agenda.GetCurrentAppointment(t);
        if (appointment == null) { // if nothing in the agenda, going/ staying home is default ;-)
            this.updatePosition(width, height, 0.7, true, rng);
            this.addWorkingRate(t, null);
            return;
        }
        // Here, there is an appointment in the agenda..

        if (this.infectionState != InfectionState.VACCINATED) { // if not vaccinated, check whether there is a block/lock. If vaccinated, permit following the agenda..
            if (this.house.blocklock) {
                this.updatePosition(width, height, 0.7, true, rng);
                this.addWorkingRate(t, appointment.appointmentType);
                return;
            }

            // policies whether infected or not 
            if (appointment.getLocation().blocklock) {
                this.addWorkingRate(t, appointment.appointmentType);
                this.updatePosition(width, height, 0.7, true, rng);
                return;
            }
        }

        var bInfected = (this.infectionState == InfectionState.INFECTED); // || this.infectionState == InfectionState.INFECTEDSEVERE || this.infectionState == InfectionState.INFECTEDCRITICAL);

        // regardless of being infected..
        if (appointment.appointmentType == AppointmentType.WORK &&
            ((schoolPolicy == SchoolPolicy.CLOSESCHOOLANDLOCKPARENTS && this.schoolNearestToHome != null && this.schoolNearestToHome.hasInfectedChild)
                || (officePolicy == OfficePolicy.CLOSEOFFICEANDLOCKEMPLOYEEHH && this.workingplace != null && this.workingplace.hasInfectedWorker))) // case 2: stay home from work when  (last case redundant..)
        {
            alert("This case should be handled by lock/ block!");
            this.addWorkingRate(t, appointment.appointmentType);
            this.updatePosition(width, height, 0.7, true, rng);
            return;
        }

        if (appointment.appointmentType == AppointmentType.RECREATION &&
            (gatheringPolicy == GatheringsPolicy.CLOSEAREANDLOCKVISITORHH && this.recareaFavorite != null && this.recareaFavorite.hasInfectedVisitor)) {
            alert("This case should be handled by lock/ block!");
            this.updatePosition(width, height, 0.7, true, rng);
            return;
        }

        // individual/ specific measures policies when infected
        if (bInfected) {
            if ((appointment.appointmentType == AppointmentType.SCHOOL && schoolPolicy == SchoolPolicy.BARILL) // case 1: stay home from school when ill
                || (appointment.appointmentType == AppointmentType.WORK && officePolicy == OfficePolicy.STAYHOMEWHENSICK)) // case 2: stay home from work when  (last case redundant..)
            {
                this.addWorkingRate(t, appointment.appointmentType);
                this.updatePosition(width, height, 0.7, true, rng);
                return;
            }
        }

        // generic measures (regardless of whether the agent itself is infected), not handled by block/ lock

        if (appointment.appointmentType == AppointmentType.RANDOMVISIT) {
            // not implemented yet.
        }

        if (this.locationCurrent.type != appointment.getLocation().type) {
            this.movementState = MovementState.MOVING;
            this.addWorkingRate(t, appointment.appointmentType);
            this.locationDestination = appointment.getLocation();
            return;
        }

        this.addWorkingRate(t, appointment.appointmentType); //

        if (this.locationCurrent == null) {
            this.initPosition(appointment.getLocation(), rng);
        }

        // also updates location variables!
        this.updatePosition(width, height, 0.7, false, rng);
    }

    initPosition(location: Location, rng: RNG) {

        this.x = location.left + this.size + (location.GetWidth() - 2 * this.size) * rng.nextNumber();
        this.y = location.top + this.size + (location.GetHeight() - 2 * this.size) * rng.nextNumber();
        var theta = rng.nextNumber() * 2 * Math.PI;
        this.xdirection = Math.sin(theta);
        this.ydirection = Math.cos(theta);
        this.locationCurrent = this.locationDestination = location;
    }

    updatePosition(width: number, height: number, speedfactor: number, goHomeIfNotAtHome: boolean, rng: RNG) {

        if (goHomeIfNotAtHome && this.locationCurrent.type != LocationType.HOME) {
            this.goHome();
            // fall through..?
        }

        if (this.movementState == MovementState.STAYING) {
            // move within locality..


            var speed = speedfactor * CBDGlobal.MovementSpeedInfectionModerator;
            this.x += this.xdirection * speed;
            if (this.x > this.locationCurrent.right - this.size ||
                this.x < this.locationCurrent.left + this.size) {
                this.xdirection *= -1;
                this.x = Math.max(this.locationCurrent.left + this.size, Math.min(this.x, this.locationCurrent.right - this.size));
            }

            this.y += this.ydirection * speed;
            if (this.y > this.locationCurrent.bottom - this.size ||
                this.y < this.locationCurrent.top + this.size) {
                this.ydirection *= -1;
                this.y = Math.max(this.locationCurrent.top + this.size, Math.min(this.y, this.locationCurrent.bottom - this.size));
            }

        }
        else {
            // head in the right direction
            this.x = (this.x + this.xdirection + width) % width;
            this.y = (this.y + this.ydirection + height) % height;

            this.changeposition(CBDGlobal.MovementSpeed, this.locationDestination.GetMidX(), this.locationDestination.GetMidY());

            // if entering the destination, change state to 'staying'
            if ((this.x >= this.locationDestination.left + this.size && this.x <= this.locationDestination.right - this.size) &&
                (this.y >= this.locationDestination.top + this.size && this.y <= this.locationDestination.bottom - this.size)) {

                // to prevent agents from being too close right away.. distribute them 
                this.x = this.locationDestination.left + this.size + (this.locationDestination.GetWidth() - 2 * this.size) * rng.nextNumber();
                this.y = this.locationDestination.top + this.size + (this.locationDestination.GetHeight() - 2 * this.size) * rng.nextNumber();

                this.movementState = MovementState.STAYING;
                this.locationCurrent = this.locationDestination;
                this.locationDestination = null;

                var theta = rng.nextNumber() * 2 * Math.PI;
                this.xdirection = Math.sin(theta);
                this.ydirection = Math.cos(theta);
            }
        }
    }

    // Aksamentov, I., Noll, N., Neher, R. 2020... adjusted for higher empirical fatality rates reported end of april
    pD() { if (this.age < 50) return 0.3; if (this.age < 70) return 0.4; return 0.5; }
    //pCAge = [[9, 5], [19, 10], [29, 10], [39, 15], [49, 20], [59, 25], [69, 35], [79, 45], [199, 55]];
    pCAge = [[9, 10], [19, 20], [29, 20], [39, 30], [49, 40], [59, 50], [69, 70], [79, 80], [199, 90]];
    pC() { return this.pCAge.find(zz => this.age <= zz[0])[1] / 100; }
    // pSAge = [[9, 1], [19, 3], [29, 3], [39, 3], [49, 6], [59, 10], [69, 25], [79, 35], [199, 50]];
    pSAge = [[9, 2], [19, 6], [29, 6], [39, 6], [49, 12], [59, 20], [69, 50], [79, 70], [199, 90]];
    pS() { return this.pSAge.find(zz => this.age <= zz[0])[1] / 100; }

    leaveHospital(time: number) {
        if (this.hospitalPick != null) {
            var ind = this.hospitalPick.patients.findIndex(zz => zz.id == this.id);
            if (ind >= 0) {
                this.hospitalPick.patients.splice(ind, 1);
                this.diseaseHistory.push("" + time + " leave hospital");
            }
            this.hospitalPick = null;
        }
    }

    diseaseHistory: string[];

    // unlike metapopulation models, the infection (i.e. the transition from susceptible to being infected) occurs by explicit social interaction in physical proximity
    diseaseProgress(time: number, rng: RNG) {

        if (this.infectionState == InfectionState.VACCINATED) return;

        if (this.infectionState == InfectionState.DECEASED || this.infectionState == InfectionState.SUSCEPTIBLE || this.infectionState == InfectionState.RECOVERED) return;

        var drw = rng.nextNumber();
        switch (this.infectionState) {
            case InfectionState.INFECTEDCRITICAL:
                {
                    var factor = 1; // I came across a factor 2 in a simulation paper!
                    if (this.hospitalPick != null) {
                        factor = 4;
                    }
                    if (time >= this.timeCDorR) {
                        if (drw < this.pD() / factor) {
                            this.infectionState = InfectionState.DECEASED;
                            this.diseaseHistory.push("" + time + " deceased");
                        }
                        else {
                            this.infectionState = InfectionState.RECOVERED;
                            this.diseaseHistory.push("" + time + " recovered");
                        }
                        
                        this.leaveHospital(time);
                    }
                }
                break;
            case InfectionState.INFECTEDSEVERE:
                {
                    // if gate not yet passed
                    if (!this.gateSCPassed) {
                        if (time >= this.timeSC) {
                            this.gateSCPassed = true;


                            if (drw < this.pC()) {
                                this.infectionState = InfectionState.INFECTEDCRITICAL;
                                this.diseaseHistory.push("" + time + " infected critically");
                            }
                        }
                    }
                    else {
                        if (time >= this.timeSR) {
                            this.infectionState = InfectionState.RECOVERED;
                            this.diseaseHistory.push("" + time + " recovered");
                        }
                    }

                    this.leaveHospital(time);
                }
                break;
            case InfectionState.INFECTED:
                {
                    if (!this.gateISPassed) {
                        if (time >= this.timeIS) {
                            this.gateISPassed = true;
                            if (drw < this.pS()) {
                                this.infectionState = InfectionState.INFECTEDSEVERE;
                                this.diseaseHistory.push("" + time + " infected severely");
                            }
                        }
                    }
                    else {
                        if (time >= this.timeIR) {
                            this.infectionState = InfectionState.RECOVERED;
                            this.diseaseHistory.push("" + time + " recovered");
                        }
                    }
                }
                break;
            case InfectionState.EXPOSED_LATENT:
                {
                    if (time >= this.timeEI_L) {
                        this.infectionState = InfectionState.EXPOSED_PRESYMPTOMATIC;
                        this.diseaseHistory.push("" + time + " presymptomatic");
                    }
                }
                break;
            case InfectionState.EXPOSED_PRESYMPTOMATIC:
                {
                    if (time >= this.timeEI_Tot) {
                        this.infectionState = InfectionState.INFECTED;
                        this.diseaseHistory.push("" + time + " infected, symptomatic");
                    }
                }
                break;
            default:
                alert("Illegal case in progress()");
                break;
        }
    }

    // discretized lognormal distribution fitted on empirical data in Li et al. (and reported in WHO report)
    incubationdistribution = [0.00, 0.05396, 0.20538, 0.37999, 0.53217, 0.65141, 0.74081, 0.80669, 0.85500, 0.89047, 0.91665, 0.93608, 0.95061, 0.96156, 0.96987,
        0.97623, 0.98112, 0.98492, 0.98788, 0.99021, 0.99205, 0.99351, 0.99468, 0.99562, 1.0];


    // infectiousness should actually also be differentiated by age..
    infectiousness = [[InfectionState.EXPOSED_LATENT, 0.0], [InfectionState.EXPOSED_PRESYMPTOMATIC, 0.05], [InfectionState.INFECTED, 0.1], [InfectionState.INFECTEDSEVERE, 0.1], [InfectionState.INFECTEDCRITICAL, 0.1]];

    infect(agents: Array<Agent>, infectionDistance: number, physicalMeasures: boolean, time: number, rng: RNG) {

        if (this.infectionState == InfectionState.VACCINATED) return;

        // if in a non-infectious state, skip..
        if (this.infectionState == InfectionState.SUSCEPTIBLE || this.infectionState == InfectionState.RECOVERED || this.infectionState == InfectionState.DECEASED) return;

        // symptoms are not showing, so no infection takes place, by assumption..
        if (this.infectionState == InfectionState.EXPOSED_LATENT) return;

        // for the moment assume that agents are not infecting other agents when moving (e.g. they are sitting in their own private cars..)
        if (this.movementState == MovementState.MOVING) return;

        // Here, the agent is infected and is showing symptoms, so may infect another agent..
        for (let a of agents) { // Note that 'randomization' would not be really required strictly speaking -- it is just a matter of infecting or not, no strategic advantage feed forward or so..
            if (a.infectionState != InfectionState.SUSCEPTIBLE || a.movementState == MovementState.MOVING) continue;
            var dx = a.x - this.x;
            if (dx > 10 || dx < -10) continue; // speed up
            var dy = a.y - this.y;
            if (dy > 10 || dy < -10) continue; // speed up
            if (a.id == this.id) continue;

            var factor = (physicalMeasures ? 0.05 : 0.15) * 0.5;
            if (dx * dx + dy * dy < infectionDistance * infectionDistance * factor) {
                var drw = rng.nextNumber();
                var drwrec = this.infectiousness.find(zz => zz[0] == this.infectionState);
                var drwval = CBDGlobal.InfectiousnessModerator * drwrec[1];

                if (drw < drwval && this.locationCurrent.type != LocationType.HOSPITAL) {
                    switch (this.infectionState) {
                        case InfectionState.EXPOSED_PRESYMPTOMATIC:
                        case InfectionState.INFECTED:
                        case InfectionState.INFECTEDSEVERE:
                        case InfectionState.INFECTEDCRITICAL:
                                a.expose(time, rng);
                                this.R0_NrInfected++;
                            break;
                        default:
                            alert('Infection state invalid');
                            break;
                    }
                }
                this.R0_NrContacts++;
            }
        }
    }
}
}