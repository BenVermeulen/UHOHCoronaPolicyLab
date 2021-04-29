/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {

    export class SimulationBase {
        world: World;
        stackedgraph: StackedGraph;
        linegraph: Graph;
        histogram: HistogramWrapper
        ctx: CanvasRenderingContext2D;
        canvas: HTMLCanvasElement;
        lastStatisticst: number = 0;
        lastStatistics: Statistics = null;
        simulationSpeed: number = CBDGlobal.NumberOfTicksPerGUIUpdate;
        shouldSaveData(): boolean { return 0 == (this.world.time % CBDGlobal.TicksPerDay); }
        
        updateStatisticsForStabilizationMinor(stats: Statistics) {
            if (this.lastStatistics == null ||
                this.lastStatistics.nrDeceased != stats.nrDeceased ||
                this.lastStatistics.nrExposed_Latent != stats.nrExposed_Latent ||
                this.lastStatistics.nrExposed_Presymptomatic != stats.nrExposed_Presymptomatic ||
                this.lastStatistics.nrInfected != stats.nrInfected ||
                this.lastStatistics.nrInfectedCritical != stats.nrInfectedCritical ||
                this.lastStatistics.nrInfectedSevere != stats.nrInfectedSevere ||
                this.lastStatistics.nrRecovered != stats.nrRecovered ||
                this.lastStatistics.nrSusceptible != stats.nrSusceptible) {
                this.lastStatisticst = this.world.time;
                this.lastStatistics = stats;
            }
        }

        updateStatisticsForStabilizationMajorChange(stats: Statistics) {
            if (this.lastStatistics == null ||
                this.lastStatistics.nrDeceased != stats.nrDeceased ||
                this.lastStatistics.nrInfectedCritical != stats.nrInfectedCritical ||
                this.lastStatistics.nrInfectedSevere != stats.nrInfectedSevere) {
                this.lastStatisticst = this.world.time;
                this.lastStatistics = stats;
            }
        }

        updateStatisticsForStabilization(stats: Statistics) {
            if (this.lastStatistics == null ||
                this.lastStatistics.nrDeceased != stats.nrDeceased ||
                this.lastStatistics.nrExposed_Latent != stats.nrExposed_Latent ||
                this.lastStatistics.nrExposed_Presymptomatic != stats.nrExposed_Presymptomatic ||
                this.lastStatistics.nrInfected != stats.nrInfected ||
                this.lastStatistics.nrInfectedCritical != stats.nrInfectedCritical ||
                this.lastStatistics.nrInfectedSevere != stats.nrInfectedSevere ||
                this.lastStatistics.nrRecovered != stats.nrRecovered ||
                this.lastStatistics.nrSusceptible != stats.nrSusceptible) {
                this.lastStatisticst = this.world.time;
                this.lastStatistics = stats;
            }
        }

        stylizedMap: boolean = false;
        includeRecAreasCentrality: boolean = false; // only in case of newstyle centrality measures..
        agendaType: AgendaType = AgendaType.REGULAR;

        logAgentDiseaseHistory() {
            this.world.agents.forEach(zz => {
                if (zz.diseaseHistory == null) {
                    console.debug("Agent " + zz.id + " no disease history");
                }
                else {
                    var str = ": ";
                    zz.diseaseHistory.forEach(xx => str += xx + " / ");
                    console.debug("Agent " + zz.id + str);
                }
            });
        }

        defaultICUCap = 4;

        constructWorld() {
            this.canvas = <HTMLCanvasElement>document.getElementById("worldcanvas");
            this.ctx = this.canvas.getContext("2d");

            this.world = new World();
            //this.world.init(ctx, false, defaultICUCapacity);

            //var grcanvas = <HTMLCanvasElement>document.getElementById();
            this.stackedgraph = new StackedGraph("graph");
            this.stackedgraph.init();
            this.stackedgraph.tMax = 10;

            this.world.init(this.ctx, false, this.defaultICUCap, this.stylizedMap, this.includeRecAreasCentrality, this.agendaType);

            this.linegraph = new Graph("graphecon");
            this.linegraph.init(label => { return '#ff0000'; });
            this.linegraph.valueMax = this.world.getMaxTotalEffectiveLabor();
            this.linegraph.tMax = 10;
            this.linegraph.yShowTicks = true;
            this.linegraph.yTicksExternalOverride = true; // for pct ticks
            this.linegraph.setPctYTicks(3); // 25, 50, 75%

            this.histogram = new HistogramWrapper();
            this.histogram.instantiate(true);

            //canvas.addEventListener('dblclick', this.world.doubleclick.bind(this.world)); // previously handled in world itself, but lost bind upon refresh
            this.canvas.addEventListener('click', this.world.singleclick.bind(this.world)); // previously handled in world itself, but lost bind upon refresh

            this.stackedgraph.colors = [
                //this.LabelToColor("susceptible"),
                this.LabelToColor("infectedcritical"),
                this.LabelToColor("infectedsevere"),
                this.LabelToColor("infected"),
                this.LabelToColor("presymptomatic"),
                this.LabelToColor("latent"),
                this.LabelToColor("susceptible"),
                this.LabelToColor("recovered"),
                this.LabelToColor("deceased")]; //.reverse();
            this.stackedgraph.fillType = [
                StackGraphFillType.BOTTOM,
                StackGraphFillType.BOTTOM,
                StackGraphFillType.BOTTOM,
                StackGraphFillType.BOTTOM,
                StackGraphFillType.BOTTOM,
                StackGraphFillType.BOTTOM,
                StackGraphFillType.BOTTOM]; //.reverse();

        }

        LabelToColor(label: string): string {
            var state = InfectionState.SUSCEPTIBLE;
            switch (label) {
                case "susceptible": state = InfectionState.SUSCEPTIBLE; break;
                case "latent": state = InfectionState.EXPOSED_LATENT; break;
                case "presymptomatic": state = InfectionState.EXPOSED_PRESYMPTOMATIC; break;
                case "infected": state = InfectionState.INFECTED; break;
                case "infectedsevere": state = InfectionState.INFECTEDSEVERE; break;
                case "infectedcritical": state = InfectionState.INFECTEDCRITICAL; break;
                case "recovered": state = InfectionState.RECOVERED; break;
                case "deceased": state = InfectionState.DECEASED; break;
                default: alert("Undefined label for color: " + label); break;
            }
            return Agent.GetColor(state);
        }

        initWorld(seed: number) {

            this.world.rngSeed = seed;
            this.world.init(this.ctx, false, this.defaultICUCap, this.stylizedMap, this.includeRecAreasCentrality, this.agendaType);
        }

        drawWorld() {
            this.world.clear();
            //this.mcSet(this.combi.getCurrent());
            this.world.draw();
            this.world.drawBox();
        }



        resetGraphics() {
            this.stackedgraph.init();
            this.stackedgraph.tMax = 10;
            this.linegraph.init(zz => { return '#ff0000'; });
            this.linegraph.valueMax = this.world.getMaxTotalEffectiveLabor();
            this.linegraph.tMax = 10;
            this.linegraph.yShowTicks = true;
            this.linegraph.setPctYTicks(3); // 25, 50, 75%
        }

        updateGraphics(stats: Statistics) {
            var tt = Math.trunc(this.world.time / CBDGlobal.TicksPerDay);
            this.stackedgraph.push(tt, [stats.nrInfectedCritical, stats.nrInfectedSevere, stats.nrInfected,
            stats.nrExposed_Presymptomatic, stats.nrExposed_Latent, stats.nrSusceptible, stats.nrRecovered, stats.nrDeceased]);
            this.stackedgraph.draw(true, true);
            this.linegraph.push("cost", tt, stats.effectiveLabor);
            this.linegraph.draw();
            this.histogram.draw(this.world.agents);
        }


    }

    export enum MCExperiment { _LOCK, _BLOCK, _TRACELAYER, _VACCINATELOCK, _VACCINATEBLOCK, NONE }
    export enum SettingMoment { IMMEDIATELY, UPONSEVERECASE }

    export class SimulationMonteCarlo extends SimulationBase {
        combi: Combi = null;
        mcInited = false;
        minNrDaysPerSimulation = 60;
        nrSeedsPerSetting = 100; 
        nrSeedsHad = 0;
        nrRunsHad = 0;
        initSeed = 11;
        nrDaysStabilizationForNext = 10;
        
        constructor() {
            super();
            this.simulationSpeed = 1000 * CBDGlobal.NumberOfTicksPerGUIUpdate;
        }


        runIsStable(): boolean { return ((this.world.time - this.lastStatisticst) / CBDGlobal.TicksPerDay) > this.nrDaysStabilizationForNext; }
        ranLongEnough(): boolean { return this.world.time >= CBDGlobal.TicksPerDay * this.minNrDaysPerSimulation; }
        ranLongEnoughStats(): boolean { return (this.lastStatistics.nrInfectedSevere + this.lastStatistics.nrInfectedCritical + this.lastStatistics.nrDeceased) > 0; }

        hasSeenSevere = false;
        hasSeenSevereCase() : boolean {
            if (!this.hasSeenSevere)
                this.hasSeenSevere = this.world.agents.some(zz => zz.infectionState == InfectionState.INFECTEDSEVERE || zz.infectionState == InfectionState.INFECTEDCRITICAL || zz.infectionState == InfectionState.DECEASED);
            return this.hasSeenSevere;
        }


        mcDefault() {
            this.world.policyGathering = GatheringsPolicy.ALLOWED;
            this.world.policyOffice = OfficePolicy.COMEALWAYS;
            this.world.policySchool = SchoolPolicy.COMEALWAYS;
            this.world.setTotalICUCapacity(2);
            this.world.policyHospitalization = HospitalizationPolicy.CRITICAL;
            this.world.policyPhysicalMeasures = false;
            this.world.setPolicyInterregionalTravel(true);
            this.agendaType = AgendaType.REGULAR;
        }


        mcSetBlockLock(settings: number[], lockNotBlock: boolean) {
            this.world.policyGathering = settings[0];
            this.world.policyOffice = settings[1];
            this.world.policySchool = settings[2];
            this.world.setTotalICUCapacity(settings[3]);
            this.world.policyHospitalization = HospitalizationPolicy.CRITICAL;
            this.world.policyPhysicalMeasures = settings[4] > 0;
            this.world.setPolicyInterregionalTravel(settings[5] > 0);
            this.agendaType = settings[6];
            if (lockNotBlock)
                this.world.lockBridgingHouseholds(settings[7]);
            else
                this.world.blockCentralSitesNew(settings[7]);
        }

        mcSetVaccinateLockSpread(settings: number[]) {

            this.world.policyGathering = settings[0];
            this.world.policyOffice = settings[1];
            this.world.policySchool = settings[2];
            this.world.setTotalICUCapacity(settings[3]);
            this.world.policyHospitalization = HospitalizationPolicy.CRITICAL;
            this.world.policyPhysicalMeasures = settings[4] > 0;
            this.world.setPolicyInterregionalTravel(settings[5] > 0);
            this.agendaType = settings[6];

            var benchmark = true;
            this.world.vaccinateHouseholds(settings[7], benchmark);
        }

        mcSetVaccinateBlockBridge(settings: number[]) {
            this.world.policyGathering = settings[0];
            this.world.policyOffice = settings[1];
            this.world.policySchool = settings[2];
            this.world.setTotalICUCapacity(settings[3]);
            this.world.policyHospitalization = HospitalizationPolicy.CRITICAL;
            this.world.policyPhysicalMeasures = settings[4] > 0;
            this.world.setPolicyInterregionalTravel(settings[5] > 0);
            this.agendaType = settings[6];

            var benchmark = true;
            this.world.vaccinateSites(settings[7], benchmark);
        }

        mcSetTraceLayer(settings: number[]) {
            this.world.policyGathering = settings[0];
            this.world.policyOffice = settings[1];
            this.world.policySchool = settings[2];
            this.world.setTotalICUCapacity(settings[3]);
            this.world.policyHospitalization = HospitalizationPolicy.CRITICAL;
            this.world.policyPhysicalMeasures = settings[4] > 0;
            this.world.setPolicyInterregionalTravel(settings[5] > 0);
            this.agendaType = settings[6];
        }

        
        setDone: boolean = false;
        mcSet(experiment: MCExperiment, settings: number[]) {
            if (this.setDone) return;

            switch (experiment) {
                case MCExperiment._VACCINATEBLOCK: this.mcSetVaccinateBlockBridge(settings); break;
                case MCExperiment._VACCINATELOCK: this.mcSetVaccinateLockSpread(settings); break;
                case MCExperiment._LOCK: this.mcSetBlockLock(settings, true); break;
                case MCExperiment._BLOCK: this.mcSetBlockLock(settings, false); break;
                case MCExperiment._TRACELAYER: this.mcSetTraceLayer(settings); break;
            }
            this.setDone = true;
        }


        logSimulationResultsTraceLayer(stats: Statistics) {
            var sep = "\t";
            var nrLockedHH = this.world.households.filter(zz => zz.location.blocklock).length;
            var nrBlockedLocation = this.world.sites.filter(zz => zz.blocklock && zz.type != LocationType.HOME).length;
            var tt = Math.trunc(this.world.time / CBDGlobal.TicksPerDay);
            console.debug("" + this.nrRunsHad + sep + this.world.rngSeed + sep +
                tt + sep +
                this.world.policyPhysicalMeasures + sep +
                this.world.policySchool + sep +
                this.world.policyOffice + sep +
                this.world.policyHospitalization + sep +
                this.world.policyGathering + sep +
                this.world.getPolicyInterregionalTravel() + sep +
                this.world.getTotalICUCapacity() + sep +
                this.agendaType + sep +
                nrLockedHH + sep +
                nrBlockedLocation + sep +
                stats.log(sep));
        }
        


        logSimulationResultsBlockLock(stats: Statistics, lockNotBlock: boolean) {
            var sep = "\t";
            var tt = Math.trunc(this.world.time / CBDGlobal.TicksPerDay);
            console.debug("" + this.nrRunsHad + sep + this.world.rngSeed + sep +
                tt + sep +
                this.world.policyPhysicalMeasures + sep +
                this.world.policySchool + sep +
                this.world.policyOffice + sep +
                this.world.policyHospitalization + sep +
                this.world.policyGathering + sep +
                this.world.getPolicyInterregionalTravel() + sep +
                this.world.getTotalICUCapacity() + sep +
                this.agendaType + sep +
                (lockNotBlock
                    ? this.world.households.filter(zz => zz.location.blocklock).length
                    : this.world.sitesForCentrality.filter(zz => zz.blocklock).length) + sep +
                stats.log(sep));
        }

        logSimulationResultsVaccinate(stats: Statistics, lockNotBlock: boolean) {
            var sep = "\t";
            var tt = Math.trunc(this.world.time / CBDGlobal.TicksPerDay);
            var ss = "";
            if (lockNotBlock) {
                ss = "" + this.world.households.filter(zz => zz.family.some(xx => xx.infectionState == InfectionState.VACCINATED)).length;
            } else {
                ss = "" + this.world.sites.filter(zz => zz.vaccinated).length;
            }

            console.debug("" + this.nrRunsHad + sep + this.world.rngSeed + sep +
                tt + sep +
                this.world.policyPhysicalMeasures + sep +
                this.world.policySchool + sep +
                this.world.policyOffice + sep +
                this.world.policyHospitalization + sep +
                this.world.policyGathering + sep +
                this.world.getPolicyInterregionalTravel() + sep +
                this.world.getTotalICUCapacity() + sep +
                this.agendaType + sep +
                ss + sep +
                stats.log(sep));
        }

        mcConstructCombis(experiment: MCExperiment) {
            switch (experiment) {
                case MCExperiment._LOCK: this.mcConstructBlockLockCombis(true); break;
                case MCExperiment._BLOCK: this.mcConstructBlockLockCombis(false); break;
                case MCExperiment._TRACELAYER: this.mcConstructLayerTraceCombis(); break;
                case MCExperiment._VACCINATELOCK: this.mcConstructVaccinateCombis(true); break;
                case MCExperiment._VACCINATEBLOCK: this.mcConstructVaccinateCombis(false); break;
            }
        }

        mcConstructBlockLockCombis(lockNotBlock: boolean) {  
            this.combi = new Combi();

            this.combi.push([GatheringsPolicy.PROHIBITED, GatheringsPolicy.ALLOWED]);
            this.combi.push([OfficePolicy.COMEALWAYS]);
            this.combi.push([SchoolPolicy.COMEALWAYS]);
            this.combi.push([2]); // ICU capacity
            this.combi.push([1]); //0, 1]); // PHYS
            this.combi.push([1]); //0,1]); // reg
            this.combi.push([AgendaType.REGULAR, AgendaType.CHANGED]);
            if (lockNotBlock) // 0,2,4,6,8,10,12,14,16,18,20,22,
                this.combi.push([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24,26,28,30,32,34,36,38,40]);//this.combi.push([0, 10, 20, 30, 40]);
            else
                this.combi.push([0, 2, 4, 6, 8, 10, 12, 14, 16]);
        }

        mcConstructVaccinateCombis(lockNotBlock: boolean) {
            this.combi = new Combi();
            this.combi.push([GatheringsPolicy.PROHIBITED]);
            this.combi.push([OfficePolicy.COMEALWAYS]);
            this.combi.push([SchoolPolicy.COMEALWAYS]);
            this.combi.push([2]); // ICU capacity
            this.combi.push([1]); //0, 1]); // PHYS
            this.combi.push([0]); //0,1]); // reg
            this.combi.push([AgendaType.REGULAR]);

            if (lockNotBlock)
                this.combi.push([10, 30, 50, 70, 90, 110]);//this.combi.push([0, 10, 20, 30, 40]);
            else
                this.combi.push([0, 2, 4, 6, 8, 10, 12]);
        }

        mcConstructLayerTraceCombis() {
            this.combi = new Combi();
            this.combi.push([GatheringsPolicy.ALLOWED, GatheringsPolicy.CLOSEAREANDLOCKVISITORHH]);
            this.combi.push([OfficePolicy.COMEALWAYS, OfficePolicy.CLOSEOFFICEANDLOCKEMPLOYEEHH]);
            this.combi.push([SchoolPolicy.COMEALWAYS, SchoolPolicy.CLOSESCHOOLANDLOCKPARENTS]);
            this.combi.push([2]); // ICU capacity
            this.combi.push([0, 1]); // PHYS
            this.combi.push([0, 1]); // reg
            this.combi.push([AgendaType.REGULAR]);
        }

        settings: number[];


        saveData(experiment: MCExperiment, draw: boolean, logDebug: boolean, forceLog: boolean) {
            if (this.shouldSaveData() || forceLog) {
                var stats = this.world.getStatistics();
                this.updateStatisticsForStabilizationMajorChange(stats);
                if (draw) this.updateGraphics(stats);

                if (logDebug) {
                    switch (experiment) {
                        case MCExperiment._LOCK: this.logSimulationResultsBlockLock(stats, true); break;
                        case MCExperiment._BLOCK: this.logSimulationResultsBlockLock(stats, false); break;
                        case MCExperiment._TRACELAYER: this.logSimulationResultsTraceLayer(stats); break;
                        case MCExperiment._VACCINATELOCK: this.logSimulationResultsVaccinate(stats, true); break;
                        case MCExperiment._VACCINATEBLOCK: this.logSimulationResultsVaccinate(stats, false); break;
                    }
                }
            }
        }

        mcExperimentSetup(experiment: MCExperiment) {
            this.constructWorld();
            this.mcConstructCombis(experiment);
            this.settings = this.combi.getCurrent();
            this.initWorld(this.initSeed);
            this.mcDefault();
            this.hasSeenSevere = false;
        }

        
        mcExperimentRun(experiment: MCExperiment, settingMoment: SettingMoment, draw: boolean) {

            if (this.settings == null) return; // 'null' also used to indicate the end of the simulation
            if (draw) this.drawWorld();

            // run the simulation for large number of ticks..
            for (var n = 0; n < this.simulationSpeed; n++) {
                // if none of the conditions is met, the 'default' settings should be used..
                if (settingMoment == SettingMoment.IMMEDIATELY
                    || (settingMoment == SettingMoment.UPONSEVERECASE && this.hasSeenSevereCase())) {
                    this.settings = this.combi.getCurrent();
                    this.mcSet(experiment, this.settings); // in the current reentrant nature this is set every period, which is actually not needed
                }

                // Every simulation day, update statistics and (possibly) graphics
                this.saveData(experiment, draw, false, false);

                // Every tick take a simulation step
                this.world.step(experiment);
            }

            // see whether the simulation run is done
            if (this.world.time >= CBDGlobal.TicksPerDay * 180) { //this.runIsStable() && this.ranLongEnough()) {

                this.saveData(experiment, false, true, true);

                // Simulation run is done: start a new simulation instance?
                // 1. Had all seeds -> set new combi of policies
                // 2. Still seeds available, just reset seed
                // (3. All done: this.settings will be equal to null -- will be caught next entry)
                if (this.nrSeedsHad == this.nrSeedsPerSetting - 1) {
                    this.settings = this.combi.getNext();
                    this.nrSeedsHad = -1;
                }
                this.setDone = false;
                this.nrSeedsHad++;
                this.nrRunsHad++;

                if (this.settings != null) {
                    
                    this.initWorld(this.initSeed + this.nrSeedsHad);
                    this.mcDefault();
                    this.hasSeenSevere = false;
                }
                if (draw) this.resetGraphics();
            }

            window.requestAnimationFrame(() => this.mcExperimentRun(experiment, settingMoment, draw));
        }
    }




    export class HistogramWrapper {

        withSus: boolean = false;
        withVaccinated: boolean = true;

        instantiate(withSuscept: boolean) {
            this.withSus = withSuscept;

            this.histogram = new StackedHistogram("agecon");
            this.histogram.yShowTicks = true;
            this.histogram.yTicksExternalOverride = false;
            this.histogram.init(ii => Agent.GetColor(ii));
            var binWidth = 10;
            for (var binIndex = 0; binIndex < 10; binIndex++) {
                var bin = this.histogram.addBin("" + binIndex, binIndex * binWidth, (binIndex + 1) * binWidth - 1);

                for (var componentID = (this.withSus ? InfectionState.SUSCEPTIBLE : InfectionState.EXPOSED_LATENT); componentID <= (this.withVaccinated ? InfectionState.VACCINATED: InfectionState.DECEASED); componentID++) {
                    bin.setComponent(componentID, 0);
                }
            }
        }

        init() {
            this.histogram.init(ii => Agent.GetColor(ii));
            var binWidth = 10;
            for (var binIndex = 0; binIndex < 10; binIndex++) {
                var bin = this.histogram.addBin("" + binIndex, binIndex * binWidth, (binIndex + 1) * binWidth - 1);
                for (var componentID = (this.withSus ? InfectionState.SUSCEPTIBLE : InfectionState.EXPOSED_LATENT); componentID <= (this.withVaccinated ? InfectionState.VACCINATED : InfectionState.DECEASED); componentID++) {
                    bin.setComponent(componentID, 0);
                }
            }
        }

        histogram: StackedHistogram;

        draw(agents: Array<Agent>) {
            this.histogram.bins.forEach(zz => zz.binComponents.forEach(zz => zz.nr = 0));
            for (var ag of agents) {
                if (this.withSus) {
                    this.histogram.bins[Math.trunc(ag.age / 10)].binComponents[ag.infectionState].nr++
                }
                else {
                    if (ag.infectionState != InfectionState.SUSCEPTIBLE)
                        this.histogram.bins[Math.trunc(ag.age / 10)].binComponents[ag.infectionState - 1].nr++
                }
            };
            this.histogram.draw();
        }
    }
}