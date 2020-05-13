/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {


    export class World {

        ctx: CanvasRenderingContext2D;
        rng: RNG;
        time: number;

        constructor() { }

        sites = new Array<Location>();

        backgroundImg: any;
        imgEyeOpen: any;
        imgEyeClosed: any;
        imgEyeMidX: number
        imgEyeMidY: number;
        imgEyeWidth: number = 50;
        imgEyeHeight: number = 50;


        findNearest<T extends SpecificLocationBase>(x: number, y: number, l: T[], distance: (_x: number, _y: number, t: Location) => number): T {
            let mx = Number.MAX_SAFE_INTEGER;
            let ml = l[0];
            for (var loc of l) {
                var dd = distance(x, y, loc.location);
                if (mx > dd) {
                    mx = dd;
                    ml = loc;
                }
            }
            return ml;
        }

        distance(x: number, y: number, location: Location) { var dx = x - location.GetMidX(); var dy = y - location.GetMidY(); return dx * dx + dy * dy; }

        houseLocations: Array<Location>;
        graves: Array<Location>;
        rngSeed = 11;

        // Identifier	37975
        // Korte titel	Huishoudens; samenstelling en grootte
        // Samenvatting	Particuliere huishoudens in Nederland naar grootte, samenstelling en leeftijd, 1 januari
        // Verslagperiode	1995 - 2019 
        // https://opendata.cbs.nl/statline/portal.html?_la=nl&_catalog=CBS&tableId=37975&_theme=94
        // Naamsvermelding 4.0 Internationaal (CC BY 4.0)
        /*
        AgeCohortDistribution =
            [[AgeGroup.AG15_19, 0.00657, 0.00657],
            [AgeGroup.AG20_29, 0.11396, 0.12053],
            [AgeGroup.AG30_39, 0.15230, 0.27283],
            [AgeGroup.AG40_49, 0.16955, 0.44238],
            [AgeGroup.AG50_59, 0.19285, 0.63524],
            [AgeGroup.AG60_69, 0.16389, 0.79912],
            [AgeGroup.AG70_79, 0.12798, 0.92710],
            [AgeGroup.AG80_89, 0.06239, 0.98949],
            [AgeGroup.AG90OVER, 0.01051, 1.00000]];
        */
        HouseholdTypeByAgeCohortDistribution =
            [
                                              //CumTot      15-19        20-29        30-39        40-49        50-59        60-69        70-79        80-89        >= 90
                    /* HouseholdType.S_0K */[0, 0.006060804, 0.0799081, 0.130088605, 0.172659603, 0.227056298, 0.283439947, 0.336787643, 0.374832911, 0.383311097],
                    /* HouseholdType.S_1K */[0.383311097, 0.38337091, 0.386108178, 0.392847242, 0.405124818, 0.419065172, 0.424163542, 0.426465839, 0.428023755, 0.428426294],
                    /* HouseholdType.S_2K */[0.428426294, 0.428429954, 0.429527284, 0.434493534, 0.443101693, 0.448792767, 0.449608319, 0.449787506, 0.449909908, 0.449938553],
                    /* HouseholdType.S_3K */[0.449938553, 0.449938553, 0.450239006, 0.452437578, 0.455416495, 0.456614271, 0.456735159, 0.456756863, 0.456763046, 0.456765822],
                    /* HouseholdType.C_0K */[0.456765822, 0.457052395, 0.483117007, 0.509735458, 0.526090796, 0.568117293, 0.648629454, 0.716418848, 0.73812165, 0.739639438],
                    /* HouseholdType.C_1K */[0.739639438, 0.739650038, 0.74495586, 0.766338523, 0.784941394, 0.81600923, 0.830681222, 0.834125394, 0.834848829, 0.83489779],
                    /* HouseholdType.C_2K */[0.83489779, 0.834900944, 0.837143429, 0.865922343, 0.912178027, 0.944556576, 0.949219724, 0.949697218, 0.949770534, 0.949775076],
                    /* HouseholdType.C_3K */[0.949775076, 0.949776338, 0.950252445, 0.960521741, 0.981976332, 0.993628395, 0.994732287, 0.994859736, 0.994874627, 0.994875384],
                    /* HouseholdType.MISC */[0.994875384, 0.995022897, 0.996908649, 0.998078411, 0.998521457, 0.999024568, 0.999541938, 0.999831792, 0.999971103, 1]
            ];

        ChildrenAgeDistribution =
            [
               //Y0_5_O0_5, Y0_5_O6_11, Y0_5_O12_17, Y0_5_O18_24, Y0_5_O25o, Y6_11_O6_11, Y6_11_O12_17, Y6_11_O18_24, Y6_11_O25o, Y12_17_O12_17, Y12_17_O18_24, Y12_17_O25o, Y18_24_O18_24, Y18_24_O25o, Y25o_O25o
                [0.247785677, 0.247785677, 0.247785677, 0.247785677, 0.247785677, 0.370499552, 0.370499552, 0.370499552, 0.370499552, 0.532964707, 0.532964707, 0.532964707, 0.788688055, 0.788688055, 1],
                [0.155072189, 0.286717337, 0.297334956, 0.299170556, 0.299291758, 0.422536071, 0.545929342, 0.556562689, 0.557142791, 0.688110691, 0.82065051, 0.824667737, 0.935056368, 0.976219532, 1],
                [0.04398678, 0.259843017, 0.356892907, 0.383021069, 0.384063571, 0.421287454, 0.61985614, 0.699304999, 0.70553085, 0.746764356, 0.913605988, 0.932944521, 0.96288061, 0.995020777, 1]
            ];


        getUniformRandomAgeChild(parentAge: number, childNr: number): number[] {

            if (childNr > 3 || childNr < 1) alert("Invalid nr of children");
            var ages = [];

            var cad = this.ChildrenAgeDistribution[childNr - 1];

            // No exact information, assume the following
            var maxAge = parentAge - 14;  // AgeGroup.AG15_19 -- Teenage pregnancy are uniform random accidents
            if (parentAge >= 20) maxAge = parentAge - 19; // other age groups.
            if (maxAge < 0)
                alert("Invalid child age. Error in parent age?");

            var ageOldest = 0;
            var ageType;

            // For 'uniformization', we cannot truncate the random value for the age. (Say 0.5 for [0-1), 0.5 for [1,2), but cut at 1.1 would have exp val 0.5*(1-0) + 0.5*(0.9* 1.1 + 0.1*(1.1 - 1.0)) 
            // Instead, keep on looping and drawing until meeting criteria. (In same example: exp val is then 0.5*(1-0) + 0.5*0.1*(1.1 - 1))
            for (; ;) { 
                var rng = this.rng.nextNumber();
                ageType = <ChildAgeSpec>cad.findIndex(zz => zz >= rng);
                switch (ageType) {
                    case ChildAgeSpec.Y0_5_O0_5: ageOldest = this.rng.nextInt32([0, 6]); break;
                    case ChildAgeSpec.Y0_5_O6_11:
                    case ChildAgeSpec.Y6_11_O6_11: ageOldest = this.rng.nextInt32([6, 12]); break;
                    case ChildAgeSpec.Y0_5_O12_17:
                    case ChildAgeSpec.Y6_11_O12_17:
                    case ChildAgeSpec.Y12_17_O12_17: ageOldest = this.rng.nextInt32([12, 17]); break;
                    case ChildAgeSpec.Y0_5_O18_24:
                    case ChildAgeSpec.Y6_11_O18_24:
                    case ChildAgeSpec.Y12_17_O18_24:
                    case ChildAgeSpec.Y18_24_O18_24: ageOldest = this.rng.nextInt32([18, 25]); break;
                    case ChildAgeSpec.Y0_5_O25o:
                    case ChildAgeSpec.Y6_11_O25o:
                    case ChildAgeSpec.Y12_17_O25o:
                    case ChildAgeSpec.Y18_24_O25o:
                    case ChildAgeSpec.Y25o_O25o: ageOldest = this.rng.nextInt32([25, maxAge+1]); break; // exception
                }
                if (ageOldest <= maxAge) break;
            }
            if (ageOldest == null || isNaN(ageOldest))
                alert("Error in ageOldest!");

            ages.push(ageOldest);
            if (ages.length == childNr) return ages;

            var ageYoungest = null;
            switch (ageType) {
                case ChildAgeSpec.Y0_5_O0_5:
                case ChildAgeSpec.Y0_5_O6_11:
                case ChildAgeSpec.Y0_5_O12_17:
                case ChildAgeSpec.Y0_5_O18_24:
                case ChildAgeSpec.Y0_5_O25o: ageYoungest = this.rng.nextInt32([0, Math.min(6, ageOldest+1)]); break; // not sure whether this [0, min(a, aO)] is proper
                case ChildAgeSpec.Y6_11_O6_11:
                case ChildAgeSpec.Y6_11_O12_17:
                case ChildAgeSpec.Y6_11_O18_24:
                case ChildAgeSpec.Y6_11_O25o: ageYoungest = this.rng.nextInt32([6, Math.min(12, ageOldest+1)]); break;
                case ChildAgeSpec.Y12_17_O12_17: 
                case ChildAgeSpec.Y12_17_O18_24:
                case ChildAgeSpec.Y12_17_O25o:
                    ageYoungest = this.rng.nextInt32([12, Math.min(18, ageOldest+1)]);
                    break;
                case ChildAgeSpec.Y18_24_O18_24:
                case ChildAgeSpec.Y18_24_O25o: ageYoungest = this.rng.nextInt32([18, Math.min(25, ageOldest+1)]); break;
                case ChildAgeSpec.Y25o_O25o: ageYoungest = this.rng.nextInt32([25, ageOldest + 1]); break; // exception
                default:
                    alert("Error in case handling");
                    break;
            }
            if (ageYoungest == null || isNaN(ageYoungest))
                alert("Error in ageYoungest!");
            ages.push(ageYoungest);
            if (ages.length == childNr) return ages;

            var ageMid = (ageOldest + ageYoungest) / 2;
            ages.push(ageMid);
            return ages;
        }


        getUniformRandomAge(agr: AgeGroup): number {
            var ag = 15;
            switch (agr) { // equivalent to uniform draw [15, 99]. However, we might have/ want to change this in the future..
                case AgeGroup.AG15_19: ag = this.rng.nextInt32([15, 20]); break;
                case AgeGroup.AG20_29: ag = this.rng.nextInt32([20, 30]); break;
                case AgeGroup.AG30_39: ag = this.rng.nextInt32([30, 40]); break;
                case AgeGroup.AG40_49: ag = this.rng.nextInt32([40, 50]); break;
                case AgeGroup.AG50_59: ag = this.rng.nextInt32([50, 60]); break;
                case AgeGroup.AG60_69: ag = this.rng.nextInt32([60, 70]); break;
                case AgeGroup.AG70_79: ag = this.rng.nextInt32([70, 80]); break;
                case AgeGroup.AG80_89: ag = this.rng.nextInt32([80, 90]); break;
                case AgeGroup.AG90OVER: ag = this.rng.nextInt32([90, 99]); break; // uniform random may be questionable
            }
            return ag;
        }


        setTotalICUCapacity(totalICUCapacity: number) {
            var capleft = totalICUCapacity;
            for (var n = this.hospitals.length; n > 0; n--) {
                var nrICUBedsPerH = capleft / n;
                // While # beds can now become lower than # patients, we assume the beds are removed only when becoming vacant (i.e. it is not filled up again..)
                var vv = Math.round(nrICUBedsPerH);
                this.hospitals[n - 1].nrBeds = vv;
                //console.trace("Set nr beds " + this.hospitals[n - 1].nrBeds + " for h ospital " + this.hospitals[n - 1].id);
                capleft -= vv;
            }
        }

        getTotalICUCapacity() {
            var total = 0;
            for (var hh of this.hospitals) total += hh.nrBeds;
            return total;
        }

        getTotalNrICUPatients() {
            var total = 0;
            for (var hh of this.hospitals) total += hh.patients.length;
            return total;
        }

        hospitals: Array<Hospital>;
        households: Array<Household>;
        workingplaces: Array<Office>;
        schools_: Array<School>;
        recareas_: Array<RecreationArea>;
        supermarkets: Array<Supermarket>;

        // this is a temp stack for initialization only
        blockedLocations: Array<number> = null;

        // upon init, store sites here to (un)block/ (un)lock
        sitesForCentrality: Array<Location>;
        centralityIncludeRecAreas: boolean = false;

        initSiteInstancesFromLocalityData(stylized: boolean, centralityIncludeRecAreas: boolean) {
            var ID = 0;
            var locData = localitiesGeneratedEindhoven;
            if (stylized)
                locData = localitiesGeneratedStylized;
            var loclocalities = locData.map(zz => {
                let l = new Location();
                l.label = zz.id;
                l.type = LocationType.UNDEFINED;
                switch (zz.type) {
                    case "HOSPITAL": l.type = LocationType.HOSPITAL; break;
                    case "SCHOOL": l.type = LocationType.SCHOOL; break;
                    case "HOUSE": l.type = LocationType.HOME; break;
                    case "OFFICE": l.type = LocationType.OFFICE; break;
                    case "SUPERMARKET": l.type = LocationType.SUPERMARKET; break;
                    case "SHOP": l.type = LocationType.SHOP; break;
                    case "RECREATIONAL": l.type = LocationType.RECREATION; break;
                    case "GRAVESITE": l.type = LocationType.GRAVESITE; break;
                }
                l.ID = ID;
                if (this.blockedLocations != null)
                    l.blocklock = this.blockedLocations.some(zz => zz == ID);
                ID++;

                l.top = zz.rectangle[0];
                l.left = zz.rectangle[1];
                l.bottom = zz.rectangle[2];
                l.right = zz.rectangle[3];
                return l;
            });

            this.houseLocations = loclocalities.filter(zz => zz.type == LocationType.HOME);
            this.graves = loclocalities.filter(zz => zz.type == LocationType.GRAVESITE);

            // create object instances of locations for contextual handling
            this.workingplaces = loclocalities.filter(zz => zz.type == LocationType.OFFICE).map(zz => { var off = new Office(); off.label = zz.label; off.location = zz; off.employees = new Array<Agent>(); return off; });
            this.schools_ = loclocalities.filter(zz => zz.type == LocationType.SCHOOL).map(zz => { var schx = new School(); schx.location = zz; schx.schoolchildren = new Array<Agent>(); return schx; });
            this.recareas_ = loclocalities.filter(zz => zz.type == LocationType.RECREATION).map(zz => { var ra = new RecreationArea(); ra.location = zz; ra.visitors = new Array<Agent>(); return ra; });
            this.hospitals = loclocalities.filter(zz => zz.type == LocationType.HOSPITAL).map(zz => { var hh = new Hospital(); hh.id = zz.label; hh.location = zz; hh.patients = new Array<Agent>(); return hh });
            this.supermarkets = loclocalities.filter(zz => zz.type == LocationType.SUPERMARKET).map(zz => { var sm = new Supermarket(); sm.location = zz; sm.visitors = new Array<Agent>(); return sm; });

            // add sites for drawing purposes
            this.supermarkets.forEach(zz => this.sites.push(zz.location));
            this.hospitals.forEach(zz => this.sites.push(zz.location));
            this.recareas_.forEach(zz => this.sites.push(zz.location));

            // not all houses are added, dependings on simulation setting, so don't add those automatically to this.sites

            // add all sites for computation of centrality index
            this.sitesForCentrality = new Array<Location>();
            this.schools_.forEach(zz => this.sitesForCentrality.push(zz.location));
            this.workingplaces.forEach(zz => this.sitesForCentrality.push(zz.location));
            if (centralityIncludeRecAreas)
                this.recareas_.forEach(zz => this.sitesForCentrality.push(zz.location));
            
        }

        // DO NOT SET THE POLICY VARIABLES!
        init(context: CanvasRenderingContext2D, preincreaseseed: boolean, icuCapacity: number, stylized: boolean, centralityIncludeRecAreas: boolean) {

            this.agents = new Array<Agent>();
            this.sites = new Array<Location>();
            //this.locations = new Array<Location>();
            this.ctx = context;
            this.rng = new RNG(preincreaseseed ? ++this.rngSeed : this.rngSeed);
            this.time = 0;
            var width = this.ctx.canvas.width;
            var height = this.ctx.canvas.height;
            var sz = 2;

            this.gateSpreadEvent = CBDGlobal.TicksSpreadEvent;

            this.backgroundImg = new Image();
            //'./fileadmin/einrichtungen/inno/COVID19/img/Kaartje-licht-small.png';
            this.centralityIncludeRecAreas = centralityIncludeRecAreas;

            if (stylized)
                this.backgroundImg.src = CBDGlobal.imgDirectory + 'stylized_map_small.png';
            else
                this.backgroundImg.src = CBDGlobal.imgDirectory + 'Kaartje-licht-small.png';
            this.backgroundImg.onload = () => window.requestAnimationFrame(this.draw.bind(this));

            this.imgEyeOpen = new Image();
            this.imgEyeOpen.src = CBDGlobal.imgDirectory + 'eye-open.png';
            this.imgEyeOpen.onload = () => window.requestAnimationFrame(this.draw.bind(this));

            this.imgEyeClosed = new Image();
            this.imgEyeClosed.src = CBDGlobal.imgDirectory + 'eye-closed.png';
            this.imgEyeClosed.onload = () => window.requestAnimationFrame(this.draw.bind(this));

            this.imgEyeWidth = this.imgEyeHeight = 50;
            var canvas = this.ctx.canvas;
            this.imgEyeMidX = canvas.width - this.imgEyeWidth / 2 - 10;
            this.imgEyeMidY = canvas.height - this.imgEyeHeight / 2 - 10;
            //canvas.addEventListener('dblclick', this.doubleclick.bind(this));

            var nrhouseholds = 200;

            this.initSiteInstancesFromLocalityData(stylized, centralityIncludeRecAreas); // also handles blocked variable
            this.setTotalICUCapacity(icuCapacity);
            
            this.households = new Array<Household>();
            var n = 0;
            for (var h = 0; h < nrhouseholds; h++) {

                var rnddr = this.rng.nextNumber();
                var ri = this.HouseholdTypeByAgeCohortDistribution.findIndex(zz => rnddr >= zz[0] && rnddr < zz[9]);
                var rr = this.HouseholdTypeByAgeCohortDistribution[ri];
                var HH = <HouseholdType>ri;
                var refAgentAG = <AgeGroup>(rr.findIndex(zz => zz > rnddr)-1);

                var ageRefPerson = this.getUniformRandomAge(refAgentAG);
                var nrInHousehold = 1;
                switch (HH) {
                    case HouseholdType.S_0K: nrInHousehold = 1; break;

                    case HouseholdType.C_0K:
                    case HouseholdType.S_1K: nrInHousehold = 2; break;

                    case HouseholdType.C_1K:
                    case HouseholdType.S_2K: nrInHousehold = 3; break;

                    case HouseholdType.C_2K:
                    case HouseholdType.S_3K: nrInHousehold = 4; break;

                    case HouseholdType.C_3K: nrInHousehold = 5; break;

                    case HouseholdType.MISC: nrInHousehold = Math.trunc(1 + this.rng.nextNumber() * 4.99);
                }

                var ageDistribChildren = null;
                switch (HH) {
                    case HouseholdType.C_0K:
                    case HouseholdType.S_0K:
                        ageDistribChildren = null;
                        break;
                    case HouseholdType.C_1K:
                    case HouseholdType.S_1K:
                        ageDistribChildren = this.getUniformRandomAgeChild(ageRefPerson, 1);
                        break;
                    case HouseholdType.C_2K:
                    case HouseholdType.S_2K:
                        ageDistribChildren = this.getUniformRandomAgeChild(ageRefPerson, 2);
                        break;
                    case HouseholdType.C_3K:
                    case HouseholdType.S_3K:
                        ageDistribChildren = this.getUniformRandomAgeChild(ageRefPerson, 3);
                        break;
                    case HouseholdType.MISC:
                        ageDistribChildren = null;
                        break;
                }
                var loc = this.houseLocations[h];
                this.sites.push(loc);

                //var hN2H = this.findNearest(loc.GetMidX(), loc.GetMidY(), hospitals);
                var sN2H = this.findNearest<Supermarket>(loc.GetMidX(), loc.GetMidY(), this.supermarkets, this.distance);
                var scN2H = this.findNearest<School>(loc.GetMidX(), loc.GetMidY(), this.schools_, this.distance);
                //var rcN2H = this.findNearest(loc.GetMidX(), loc.GetMidY(), recarea);
                var recareaFamily = new RecreationArea();
                recareaFamily = this.recareas_[this.rng.nextInt32() % this.recareas_.length];
                
                var household = new Household();
                household.family = new Array<Agent>();
                household.label = "";
                household.location = loc;
                this.households.push(household);
                for (var k = 0; k < nrInHousehold; k++) {

                    var a = new Agent();
                    a.id = "id " + n++;
                    a.infectionState = InfectionState.SUSCEPTIBLE;
                    a.size = sz;
                    a.R0_NrInfected = 0;
                    a.R0_NrContacts = 0;
                    a.locationDestination = a.locationCurrent = a.house = loc;
                    a.initPosition(a.house, this.rng);
                    a.movementState = MovementState.STAYING;

                    a.householdtype = HH;
                    a.hospitals = this.hospitals;
                    a.hospitalPick = null; // = hN2H;
                    a.supermarketNearestToHome = sN2H;
                    a.schoolNearestToHome = null; // use this to check whether the agent is a school-goer
                    a.recareaFavorite = recareaFamily;
                    recareaFamily.visitors.push(a);

                    a.age = 45;
                    switch (HH) {
                        case HouseholdType.C_0K:
                        case HouseholdType.C_1K:
                        case HouseholdType.C_2K:
                        case HouseholdType.C_3K:
                            if (k == 0 ) {
                                a.age = ageRefPerson;
                            }
                            else if (k == 1) {
                                a.age = household.family[0].age; // should be in same category, roughly, for the moment take same age..
                            }
                            else // https://opendata.cbs.nl/statline/#/CBS/nl/dataset/7461bev/table?ts=1585189803300 // uniform not so ridiculous
                            {
                                a.age = ageDistribChildren[k-2];
                            }
                            break;
                        case HouseholdType.S_0K:
                        case HouseholdType.S_1K:
                        case HouseholdType.S_2K:
                        case HouseholdType.S_3K:
                            if (k == 0)
                                a.age = ageRefPerson;
                            else // 
                            {
                                a.age = ageDistribChildren[k - 1];
                            }
                            break;
                        case HouseholdType.MISC:
                            a.age = this.getUniformRandomAge(refAgentAG); // we assume that all people are roughly the same age.. (e.g. student flat, care home..)
                            break;
                    }


                    // if (isNaN(a.age)) alert("" + a.id + "has NaN age!");

                    var weekday = [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday];
                    a.agenda = new Agenda();
                    if (a.age > 65) {

                        var begin = this.rng.nextInt32([10, 18]) + (this.rng.nextInt32() % 2) * 0.5;
                        var end = begin + 1.5;
                        for (var day of weekday) {
                            a.agenda.appointments.push(new Appointment(AppointmentType.SUPERMARKET, day, begin, end, a.supermarketNearestToHome.location));
                        }
                        a.agenda.appointments.push(new Appointment(AppointmentType.SUPERMARKET, DayOfWeek.Saturday, begin, end, a.supermarketNearestToHome.location));
                        a.agenda.appointments.push(new Appointment(AppointmentType.RECREATION, DayOfWeek.Sunday, 11, 15, a.recareaFavorite.location));
                    }
                    else if (a.age > 20) {

                        var nrOfficesToConsider = 3;
                        var nearbyOffices = new Array<Office>();
                        for (var off of this.workingplaces) nearbyOffices.push(off);
                        while (nearbyOffices.length > nrOfficesToConsider) {
                            var maxd = 0;
                            var maxi = -1;
                            for (var ioff = 0; ioff < nearbyOffices.length; ioff++) {
                                var dd = nearbyOffices[ioff].location.GetDistanceSquareToMid(a.house.GetMidX(), a.house.GetMidY());
                                if (dd > maxd) {
                                    maxd = dd;
                                    maxi = ioff;
                                }
                            }
                            nearbyOffices.splice(maxi, 1);
                        }

                        a.workingplace = nearbyOffices[this.rng.nextInt32([0, nearbyOffices.length])];
                        a.workingplace.employees.push(a); // just keep employees for future usage 
                        
                        var usedToWorkingAtHome = true;
                        var frVital = 3.1 / 9; // vital profession?
                        var frGoToWork = 0.4;  // goes to work, 'physically bound' work
                        if (this.rng.nextNumber() < Math.max(frGoToWork, frVital)) {
                            a.workHomeEffectivenessFactor = 1.0; // they are used to it, and there is no dip (other than disruption, see below)
                        }
                        else {
                            // worker does not go to work
                            var frThatAlreadyWorkedFromHome = 0.4;
                            if (this.rng.nextNumber() < frThatAlreadyWorkedFromHome) {
                                a.workHomeEffectivenessFactor = 1.0; // they are used to it, and there is no dip (other than disruption, see below)
                            }
                            else {
                                usedToWorkingAtHome = false;
                                // do not usually work from home:
                                // a. is not possible (catering industry), zero productivity
                                // b. is new, so lower productivity
                                var frNotPossible = 0.5;
                                if (this.rng.nextNumber() < frNotPossible) {
                                    a.workHomeEffectivenessFactor = 0;
                                }
                                else {
                                    a.workHomeEffectivenessFactor = 0.75; // not used to it;
                                }
                            }
                        }

                        var effectivenessDropDisruption = 0.75;
                        a.workHomeEffectiveness *= effectivenessDropDisruption;

                        if (!usedToWorkingAtHome) {
                            var frReductionChildren = [[HouseholdType.S_0K, 1], [HouseholdType.S_1K, 0.9], [HouseholdType.S_2K, 0.8], [HouseholdType.S_3K, 0.7],
                            [HouseholdType.C_0K, 1], [HouseholdType.C_1K, 0.95], [HouseholdType.C_2K, 0.9], [HouseholdType.C_3K, 0.8], [HouseholdType.MISC, 0.9]];

                            var frRedChildren = frReductionChildren.find(zz => zz[0] == a.householdtype)[1];
                            a.workHomeEffectiveness *= frRedChildren;
                        }

                        if (this.sites.find(zz => zz.label == a.workingplace.label) == null)
                            this.sites.push(a.workingplace.location);

                        for (var day of weekday) {
                            a.agenda.appointments.push(new Appointment(AppointmentType.WORK, day, 8, 17, a.workingplace.location));
                            a.agenda.appointments.push(new Appointment(AppointmentType.SUPERMARKET, day, 17.5, 18.5, a.supermarketNearestToHome.location));
                        }
                        //a.agenda.appointments.push(new Appointment(AppointmentType.SHOPPING, DayOfWeek.Saturday, 11, 14, a.recareaFavorite));
                        a.agenda.appointments.push(new Appointment(AppointmentType.SUPERMARKET, DayOfWeek.Saturday, 14, 16, a.supermarketNearestToHome.location));
                        a.agenda.appointments.push(new Appointment(AppointmentType.RECREATION, DayOfWeek.Sunday, 11, 15, a.recareaFavorite.location));
                    }
                    else {

                        // find nearby school
                        a.schoolNearestToHome = scN2H;
                        a.schoolNearestToHome.schoolchildren.push(a);
                        if (this.sites.find(zz => zz.label == a.schoolNearestToHome.location.label) == null) // add to sites to draw
                            this.sites.push(a.schoolNearestToHome.location);

                        var weekday = [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday];
                        for (var day of weekday) {
                            a.agenda.appointments.push(new Appointment(AppointmentType.SCHOOL, day, 9, 16, a.schoolNearestToHome.location));
                        }

                        a.agenda.appointments.push(new Appointment(AppointmentType.RECREATION, DayOfWeek.Sunday, 11, 15, a.recareaFavorite.location));
                    }
                    this.agents.push(a);
                    household.family.push(a);
                }
                for (var _a of household.family) {
                    _a.family = household.family;
                }


                /*var famstr = "";
                household.family.forEach(zz => famstr += " " + zz.age);
                console.debug(famstr);  */
            }

            var tr = new TransmissionChannelsMeso();
            var newStyleCentrality = false; 
            if (newStyleCentrality) {
                tr.determineDegreeCentralityMicro(this.households, this.schools_, this.workingplaces, this.recareas_);
            }
            else {
                tr.determineCentrality(CentralityType.BETWEENNESS, this.households, this.schools_, this.workingplaces);
                this.bridges = tr.bridges;
            }

            // infect patient zero!
            var checkorder = [HouseholdType.C_2K, HouseholdType.C_3K, HouseholdType.S_2K, HouseholdType.S_3K, HouseholdType.C_1K, HouseholdType.S_1K, HouseholdType.C_0K, , HouseholdType.MISC];
            var patientZero = null;
            for (var hh of checkorder) {
                patientZero = this.agents.find(zz => zz.householdtype == hh);
                if (patientZero != null) break;
            }
            patientZero.expose(0, this.rng, 1);

        }


        lockBridgingHouseholds(nr: number) {

            for (var hh of this.households) {
                
                var totcentr = 0;
                for (var ag of hh.family) {
                    var loc = ag.schoolNearestToHome.location;
                    if (loc == null && ag.workingplace != null) loc = ag.workingplace.location; //
                    if (loc == null) continue; // might be retired person
                    totcentr += loc.centralityHelper;
                }
                hh.__centralityBridgeHelper = totcentr;
            }
            this.households.sort((a, b) => - a.__centralityBridgeHelper + b.__centralityBridgeHelper);
            for (var i = 0; i < this.households.length; i++)
                this.households[i].location.blocklock = i < nr;
        }

        blockCentralSitesNew(nr: number) {
            var l = this.sitesForCentrality.sort((a, b) => - a.centralityHelper + b.centralityHelper);
            for (var i = 0; i < l.length; i++)
                l[i].blocklock = i < nr;
        }

        bridges: Array<Bridge>;
        agents = new Array<Agent>();

        draw() {

            for (var loc of this.sites) {
                var col = "";
                switch (loc.type) {
                    case LocationType.HOME: col = "#f7b86b"; break;     //<---+
                    case LocationType.HOSPITAL: col = '#FCE8E6'; break; // on the map image, it is '#F6B76A' to look like residential area.. However, we do use a different color for the hospital..
                    case LocationType.OFFICE: col = "#d7c9e3"; break;
                    case LocationType.SCHOOL: col = "#FF3C82"; break;
                    case LocationType.SHOP: col = "#f19179"; break;
                    case LocationType.SUPERMARKET: col = "#f19179"; break;
                    case LocationType.RECREATION: col = "#a8cf71"; break;
                    case LocationType.GRAVESITE: col = '#0094FF'; break;
                }

                this.ctx.beginPath();
                this.ctx.fillStyle = col;
                this.ctx.fillRect(loc.left, loc.top, loc.right - loc.left + 1, loc.bottom - loc.top + 1);
                this.ctx.strokeStyle = '#000000';
                this.ctx.strokeRect(loc.left, loc.top, loc.right - loc.left + 1, loc.bottom - loc.top + 1);

                if (loc.blocklock) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 3;
                    if (loc.type == LocationType.HOME) {
                        this.ctx.strokeRect(loc.left, loc.top, loc.right - loc.left + 1, loc.bottom - loc.top + 1);
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeStyle = '#ff0000';
                        this.ctx.strokeRect(loc.left, loc.top, loc.right - loc.left + 1, loc.bottom - loc.top + 1);
                    }
                    else if (loc.type == LocationType.RECREATION || loc.type == LocationType.SCHOOL || loc.type == LocationType.OFFICE) {
                        this.ctx.moveTo(loc.left, loc.top);
                        this.ctx.lineTo(loc.right, loc.bottom);
                        this.ctx.moveTo(loc.right, loc.top);
                        this.ctx.lineTo(loc.left, loc.bottom);
                        this.ctx.stroke();
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeStyle = '#ff0000';
                        this.ctx.moveTo(loc.left, loc.top);
                        this.ctx.lineTo(loc.right, loc.bottom);
                        this.ctx.moveTo(loc.right, loc.top);
                        this.ctx.lineTo(loc.left, loc.bottom);
                        this.ctx.stroke();
                    }
                    else {
                        alert("Drawing blocked state has not been implemented for this locality type");
                    }
                }
            }

            var sorted = this.agents.sort((z1, z2) => z1.infectionState - z2.infectionState);
            for (var a of sorted) {
                if (a.infectionState == InfectionState.DECEASED) continue;
                a.draw(this.ctx, this.time);
            }


            var deadAgents = this.agents.filter(zz => zz.infectionState == InfectionState.DECEASED);
            if (deadAgents.length > 0) {
                for (var n = 0; n < deadAgents.length; n++)
                    for (var gr of this.graves) {
                        if (n > this.graves.length - 1) break; // cannot draw more!
                        var gr = this.graves[n];
                        this.ctx.beginPath();
                        this.ctx.fillStyle = deadAgents[n].getColor();
                        this.ctx.fillRect(gr.left, gr.top, gr.right - gr.left, gr.bottom - gr.top);
                    }
            }

            var radius = 20;
            var margin = 5;
            this.drawClock(this.ctx.canvas.width - radius - margin * 3, radius + margin, radius);
            var ftsz = 10;
            this.drawCalendar(Math.floor(this.time / CBDGlobal.TicksPerDay), this.ctx.canvas.width - radius - margin * 3, 2 * radius + margin + margin, ftsz);
            var widthtext = 150;
            var sz = 4;
            margin = 4;
            this.drawStatistics(this.ctx.canvas.width - 2 * radius - margin - widthtext, sz, margin, ftsz);

            var drawCentrality = this.showToggleSNA && this.eyeOpen;
            if (drawCentrality) {

                if (this.bridges != null) {
                    for (var bridge of this.bridges) {

                        this.ctx.beginPath();
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.lineWidth = bridge.ties.length;
                        this.ctx.moveTo(bridge.location1.GetMidX(), bridge.location1.GetMidY());
                        this.ctx.lineTo(bridge.location2.GetMidX(), bridge.location2.GetMidY());
                        this.ctx.stroke();
                    }
                }
                this.ctx.lineWidth = 1; // reset

                var ftszsmall = 9;
                for (var loc of this.sites) {

                    if ((!(loc.type == LocationType.RECREATION && this.centralityIncludeRecAreas)) &&
                        loc.type != LocationType.SCHOOL &&         // centrality only computed for 
                        loc.type != LocationType.OFFICE ) continue;  //  .. school and offices currently..

                    var x = loc.GetMidX();
                    var y = loc.GetMidY();
                    var r = 10;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, r, 0, Math.PI * 2);
                    if (!loc.blocklock)
                        this.ctx.fillStyle = '#ffffff';
                    else
                        this.ctx.fillStyle = '#ff0000';
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.stroke();

                    this.ctx.beginPath();
                    this.ctx.fillStyle = '#444444';
                    this.ctx.textBaseline = "middle";
                    this.ctx.textAlign = "center";
                    this.ctx.font = "" + ftszsmall + "px Arial";
                    this.ctx.fillText(("" + (1000 + loc.centralityHelper)).substr(1, 3), x, y);
                }
            }
        }

        drawStatistics(x: number, sz: number, margin: number, ftsz: number) {


            var CFRstr = "";
            var nrrecovered = this.agents.filter(zz => zz.infectionState == InfectionState.RECOVERED).length;
            var nrdeceased = this.agents.filter(zz => zz.infectionState == InfectionState.DECEASED).length;
            if (nrdeceased + nrrecovered > 0) {
                CFRstr = " [CFR: " + (nrdeceased / (nrdeceased + nrrecovered)).toFixed(2) + "]";
            }

            var y = margin + ftsz;
            var ifst = [InfectionState.SUSCEPTIBLE, InfectionState.EXPOSED_LATENT, InfectionState.EXPOSED_PRESYMPTOMATIC, InfectionState.INFECTED,
                            InfectionState.INFECTEDSEVERE, InfectionState.INFECTEDCRITICAL, InfectionState.RECOVERED, InfectionState.DECEASED];
            for (var st of ifst) {

                var nr = this.agents.filter(zz => zz.infectionState == st).length;
                this.ctx.beginPath();
                this.ctx.arc(x, y - sz / 2, sz, 0, Math.PI * 2);
                this.ctx.fillStyle = Agent.GetColor(st);
                this.ctx.fill();
                this.ctx.strokeStyle = '#000000';
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.fillStyle = '#444444';
                this.ctx.textBaseline = "middle";
                this.ctx.textAlign = "right";
                this.ctx.font = "" + ftsz + "px Arial";
                this.ctx.fillText(("" + (1000 + nr)).substr(1, 3), x - sz - margin, y);

                this.ctx.beginPath();
                this.ctx.fillStyle = '#444444';
                this.ctx.textBaseline = "middle";
                this.ctx.textAlign = "left";
                this.ctx.font = "" + ftsz + "px Arial";

                var str = agentStateLabel[st][this.language];
                if (st == InfectionState.DECEASED) str += CFRstr;

                this.ctx.fillText(str, x + sz + margin - 1, y);

                y += (margin - 1) + ftsz;
            }


            // There are various ways to compute R/ R0. Here, we use a very direct way
            var R0Neu = 0;
            var nNeu = 0;
            for (var ag of this.agents) {

                if (ag.infectionState != InfectionState.SUSCEPTIBLE &&
                    ag.infectionState != InfectionState.EXPOSED_LATENT) {
                    R0Neu += ag.R0_NrInfected;
                    nNeu++;
                }
            }
            if (nNeu > 0)
                R0Neu /= nNeu;

            this.ctx.beginPath();
            this.ctx.fillStyle = '#444444';
            this.ctx.textBaseline = "middle";
            this.ctx.textAlign = "left";
            this.ctx.font = "" + ftsz + "px Arial";
            //this.ctx.fillText("R0: " + (R0 + 0).toFixed(2) + "  alt: " + R0Alt.toFixed(2), x, y);
            this.ctx.fillText("R: " + R0Neu.toFixed(2) /*+ " " CFRstr*/, x, y);
        }

        Sc2C(x: number, y: number): Coordinate {
            const rect = this.ctx.canvas.getBoundingClientRect();
            var p = new Coordinate();
            p.x = x - rect.left;
            p.y = y - rect.top;
            return p;
        }

        showToggleSNA: boolean = false;

        singleclick(event: MouseEvent) {

            var c = this.Sc2C(event.x, event.y);

            if (this.showToggleSNA) {
                var dx = c.x - this.imgEyeMidX;
                var dy = c.y - this.imgEyeMidY;
                if (dx * dx + dy * dy < this.imgEyeWidth * this.imgEyeWidth / 4) {
                    this.eyeOpen = !this.eyeOpen;
                    return;
                }
            }
            //if (!this.eyeOpen) return;

            var localities = this.sites.filter(zz => zz.type == LocationType.OFFICE || zz.type == LocationType.SCHOOL || zz.type == LocationType.RECREATION || zz.type == LocationType.HOME);
            for (var loc of localities) {
                if (loc.IsIn(c.x, c.y)) {
                    loc.blocklock = !loc.blocklock;
                    return;
                }
            }
        }

        drawClock(x: number, y: number, r: number) {
            var angleSmallHand = Math.PI * 4 * (this.time % CBDGlobal.TicksPerDay) / CBDGlobal.TicksPerDay;
            var angleBigHand = Math.PI * 2 * (this.time % CBDGlobal.TicksPerHour) / CBDGlobal.TicksPerHour;

            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.stroke();

            // small hand
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + r * 0.5 * Math.sin(angleSmallHand), y - r * 0.5 * Math.cos(angleSmallHand));
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + r * 0.9 * Math.sin(angleBigHand), y - r * 0.9 * Math.cos(angleBigHand));
            this.ctx.stroke();
        }

        language: Language = Language.ENGLISH;


        drawCalendar(dt: number, x: number, y: number, ftsz: number) {

            var str = ("" + (1000 + dt + 1)).substr(1, 3); // add 1 as most people are not used to start counting days with zero
            var daystr = daysOfWeekLabel[<DayOfWeek>(dt % 7)][this.language];
            this.ctx.fillStyle = '#000000';
            this.ctx.textBaseline = "top";
            this.ctx.textAlign = "center";
            this.ctx.font = "bold " + ftsz + "px Arial";
            this.ctx.fillText(daystr, x, y);
            this.ctx.fillText(str, x, y + ftsz + 3);
        }

        policyOnePartnerToSupermarket = false;
        policyPhysicalMeasures = false;

        setPolicyInterregionalTravel(v: boolean) {
            //if (v != this.policyInterregionalTravelPermitted) 
                //console.debug("Change policyInterregionalTravelPermitted");
            this.policyInterregionalTravelPermitted = v;
            
        }
        getPolicyInterregionalTravel() { return this.policyInterregionalTravelPermitted; }
        private policyInterregionalTravelPermitted = true;

        policyOffice: OfficePolicy = OfficePolicy.COMEALWAYS;
        setOfficePolicy(value: string) {
            this.policyOffice = OfficePolicy.COMEALWAYS;
            switch (value) {
                case "stayhomewhensick": this.policyOffice = OfficePolicy.STAYHOMEWHENSICK; break;
                case "workfromhome": this.policyOffice = OfficePolicy.STAYHOMEALWAYS; break;
                case "come": this.policyOffice = OfficePolicy.COMEALWAYS; break;
                case "closeofficeandlockemployeehh": this.policyOffice = OfficePolicy.CLOSEOFFICEANDLOCKEMPLOYEEHH; break;
                default: alert("invalid value " + value);
            }
        }

        policyHospitalization: HospitalizationPolicy = HospitalizationPolicy.NONE;
        setHospitalizationPolicy(value: string) {
            this.policyHospitalization = HospitalizationPolicy.NONE;
            switch (value) {
                case "none": this.policyHospitalization = HospitalizationPolicy.NONE; break;
                case "critical": this.policyHospitalization = HospitalizationPolicy.CRITICAL; break;
                case "severe_and_critical": this.policyHospitalization = HospitalizationPolicy.SEVERE_AND_CRITICAL; break;
            }
        }

        policyGathering: GatheringsPolicy = GatheringsPolicy.ALLOWED;
        setGatheringsPolicy(value: string) {
            this.policyGathering = GatheringsPolicy.ALLOWED;
            switch (value) {
                case "allowed": this.policyGathering = GatheringsPolicy.ALLOWED; break;
                case "prohibited": this.policyGathering = GatheringsPolicy.PROHIBITED; break;
                case "closeareaandlockvisitorhh": this.policyGathering = GatheringsPolicy.CLOSEAREANDLOCKVISITORHH; break;
            }
        }

        policySchool: SchoolPolicy = SchoolPolicy.COMEALWAYS;
        setSchoolPolicy(value: string) {
            this.policySchool = SchoolPolicy.COMEALWAYS;
            switch (value) {
                case "none": this.policySchool = SchoolPolicy.COMEALWAYS; break;
                case "barill": this.policySchool = SchoolPolicy.BARILL; break;
                case "closespecific": this.policySchool = SchoolPolicy.CLOSESPECIFIC; break;
                case "closeschoolandlockparents": this.policySchool = SchoolPolicy.CLOSESCHOOLANDLOCKPARENTS; break;
                case "closeall": this.policySchool = SchoolPolicy.CLOSEALL; break;
            }
        }

        policyBasedHouseholdLock() {

            if (this.policySchool == SchoolPolicy.CLOSESCHOOLANDLOCKPARENTS ||
                this.policyOffice == OfficePolicy.CLOSEOFFICEANDLOCKEMPLOYEEHH ||
                this.policyGathering == GatheringsPolicy.CLOSEAREANDLOCKVISITORHH) {

                //var IDsSchools = [];
                /*
                var schools = this.sites.filter(zz => zz.type == LocationType.SCHOOL);
                for (var sch of schools) {
                    var schchildr = this.agents.filter(zz => zz.schoolNearestToHome != null && zz.schoolNearestToHome.location.label == sch.label);
                    var someill = schchildr.some(zz => zz.infectionState == InfectionState.INFECTED || zz.infectionState == InfectionState.INFECTEDCRITICAL || zz.infectionState == InfectionState.INFECTEDSEVERE);
                    if (someill) IDsSchools.push(sch.label);
                }*/

                for (var hh of this.households) {
                    var lock = false;
                    for (var a of hh.family) {
                        lock = lock || (this.policySchool == SchoolPolicy.CLOSESCHOOLANDLOCKPARENTS && a.schoolNearestToHome != null && a.schoolNearestToHome.hasInfectedChild);
                        lock = lock || (this.policyGathering == GatheringsPolicy.CLOSEAREANDLOCKVISITORHH && a.recareaFavorite != null && a.recareaFavorite.hasInfectedVisitor);
                        lock = lock || (this.policyOffice == OfficePolicy.CLOSEOFFICEANDLOCKEMPLOYEEHH && a.workingplace != null && a.workingplace.hasInfectedWorker);
                    }
                    hh.location.blocklock = lock;
                }
            }
        }

        policyBasedSchoolBlock() {
            switch (this.policySchool) {
                case SchoolPolicy.CLOSEALL: this.schools_.forEach(zz => zz.location.blocklock = true); break;
                case SchoolPolicy.CLOSESPECIFIC:
                case SchoolPolicy.CLOSESCHOOLANDLOCKPARENTS: // the household isolation is handled in policyBasedHouseholdLock
                    this.schools_.forEach(ss => {
                        if (ss.hasInfectedChild)
                            ss.location.blocklock = true;
                    }); break;
            }
        }

        policyBasedOfficeBlock() {
            switch (this.policyOffice) {
                case OfficePolicy.STAYHOMEALWAYS: this.workingplaces.forEach(zz => zz.location.blocklock = true); break;
                case OfficePolicy.CLOSEOFFICEANDLOCKEMPLOYEEHH:  // the household isolation is handled in policyBasedHouseholdLock
                    this.workingplaces.forEach(ss => {
                        if (ss.hasInfectedWorker)
                            ss.location.blocklock = true;
                    }); break;
            }
        }

        policyBasedRecAreaBlock() {
            switch (this.policyGathering) {
                case GatheringsPolicy.PROHIBITED: this.recareas_.forEach(zz => zz.location.blocklock = true); break;
                case GatheringsPolicy.CLOSEAREANDLOCKVISITORHH: // the household isolation is handled in policyBasedHouseholdLock
                    this.workingplaces.forEach(ss => {
                        if (ss.hasInfectedWorker)
                            ss.location.blocklock = true;
                    }); break;
            }
        }


        step() {

            var w = this.ctx.canvas.width;
            var h = this.ctx.canvas.height;

            this.households.forEach(ss => ss.location.blocklock = false );
            this.schools_.forEach(ss => { ss.location.blocklock = false; ss.hasInfectedChild = ss.schoolchildren.some(zz => zz.infectionState == InfectionState.INFECTED || zz.infectionState == InfectionState.INFECTEDCRITICAL || zz.infectionState == InfectionState.INFECTEDSEVERE); });
            this.workingplaces.forEach(ss => { ss.location.blocklock = false; ss.hasInfectedWorker = ss.employees.some(zz => zz.infectionState == InfectionState.INFECTED || zz.infectionState == InfectionState.INFECTEDCRITICAL || zz.infectionState == InfectionState.INFECTEDSEVERE); });
            this.recareas_.forEach(ss => { ss.location.blocklock = false; ss.hasInfectedVisitor = ss.visitors.some(zz => zz.infectionState == InfectionState.INFECTED || zz.infectionState == InfectionState.INFECTEDCRITICAL || zz.infectionState == InfectionState.INFECTEDSEVERE); });
            this.policyBasedSchoolBlock();
            this.policyBasedOfficeBlock();
            this.policyBasedRecAreaBlock();
            this.policyBasedHouseholdLock(); // to be called after policyBasedSchoolBlock

            this.agents.forEach(aa => aa.step(this.time, w, h, this.rng, this.policySchool, this.policyOffice, this.policyHospitalization, this.policyGathering));

            for (var a of this.agents) {
                a.diseaseProgress(this.time, this.rng);
                a.infect(this.agents, CBDGlobal.InfectionDistance, this.policyPhysicalMeasures, this.time, this.rng);
            }

            if (this.time > this.gateSpreadEvent) {
                this.gateSpreadEvent += CBDGlobal.TicksSpreadEvent; // counter should continue because of intermediate interventions..

                if (this.policyInterregionalTravelPermitted) {
                    var nr = 1;
                    for (var n = 0; n < nr; n++) {
                        var suscag = this.agents.filter(zz => zz.infectionState == InfectionState.SUSCEPTIBLE);
                        if (suscag.length == 0) break;

                        var newinf = suscag[this.rng.nextInt32([0, suscag.length])];
                        newinf.expose(this.time, this.rng, 1);  // incub time of 1   
                    }
                }

            }

            this.time++;
        }
        gateSpreadEvent: number = CBDGlobal.TicksSpreadEvent;

        eyeOpen: boolean = false;
        clear() {
            //           this.ctx.beginPath();
            //         this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.drawImage(this.backgroundImg, 0, 0);

            if (this.showToggleSNA) {
                this.ctx.drawImage(
                    this.eyeOpen ? this.imgEyeOpen : this.imgEyeClosed, this.imgEyeMidX - this.imgEyeWidth / 2, this.imgEyeMidY - this.imgEyeHeight / 2);
            }
            //       this.ctx.fillStyle = '#f0f0f0';
            //     this.ctx.fill();
            //this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        drawBox() {
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.strokeStyle = '#202020';
            this.ctx.stroke();
        }

        getStatistics(): Statistics {
            var s = new Statistics();

            // compute the 'average' work output 
            var nrDaysToIncludeInWorkoutputStats = 1;
            var nrworkoutp = Math.min(nrDaysToIncludeInWorkoutputStats, this.agents[0].laborOutputs.length);

            if (nrworkoutp  == 0)
                s.effectiveLabor = this.getMaxTotalEffectiveLabor();

            for (var a of this.agents) {
                switch (a.infectionState) {
                    case InfectionState.SUSCEPTIBLE: s.nrSusceptible++; break;
                    case InfectionState.EXPOSED_LATENT: s.nrExposed_Latent++; break;
                    case InfectionState.EXPOSED_PRESYMPTOMATIC: s.nrExposed_Presymptomatic++; break;
                    case InfectionState.INFECTED: s.nrInfected++; break;
                    case InfectionState.INFECTEDSEVERE: s.nrInfectedSevere++; break;
                    case InfectionState.INFECTEDCRITICAL: s.nrInfectedCritical++; break;
                    case InfectionState.RECOVERED: s.nrRecovered++; break;
                    case InfectionState.DECEASED: s.nrDeceased++; break;
                }

                for (var i = 0; i < nrworkoutp; i++)
                    s.effectiveLabor += a.laborOutputs[a.laborOutputs.length - i - 1].fractionEffective;
            }
            if (nrworkoutp > 0)
                s.effectiveLabor /= nrworkoutp;

            return s;
        }

        getMaxTotalEffectiveLabor(): number {
            var tot = 0;
            for (var a of this.agents) {
                for(var p of a.agenda.appointments)
                {
                    if (p.appointmentType == AppointmentType.WORK) {
                        tot += p.end - p.begin;
                    }
                }
            }
            return tot;
        }
    }
}