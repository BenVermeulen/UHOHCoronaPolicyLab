/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {

    export class Bridge {
        location1: Location;
        location2: Location;
        ties: Array<Household>;
    }

    export enum CentralityType { DEGREE, BETWEENNESS }

    export class LocationStatistics {
        location: Location;
        value: number;
    }

    export class TransmissionChannelsMeso {

        constructor() { }

        determineBridges(households: Array<Household>): Array<Bridge> {
            var connections = new Array<Bridge>();
            for (var hh of households) {
                for (var i = 0; i < hh.family.length - 1; i++)
                    for (var j = i + 1; j < hh.family.length; j++) {

                        var l1 = null;
                        if (hh.family[i].schoolNearestToHome != null) l1 = hh.family[i].schoolNearestToHome.location;
                        if (l1 == null && hh.family[i].workingplace != null) l1 = hh.family[i].workingplace.location;
                        if (l1 == null) continue;

                        var l2 = null;
                        if (hh.family[j].schoolNearestToHome != null) l2 = hh.family[j].schoolNearestToHome.location;
                        if (l2 == null && hh.family[j].workingplace != null) l2 = hh.family[j].workingplace.location;
                        if (l2 == null) continue;

                        if (l1.ID == l2.ID) continue;

                        if (l1.ID > l2.ID) {
                            var l3 = l1;
                            l1 = l2;
                            l2 = l3;
                        }

                        var connection = connections.find(zz => zz.location1.ID == l1.ID && zz.location2.ID == l2.ID);
                        if (connection == null) {
                            connection = new Bridge();
                            connection.location1 = l1;
                            connection.location2 = l2;
                            connection.ties = new Array<Household>();
                            connections.push(connection);
                        }
                        connection.ties.push(hh);


                    }
            }
            return connections;
        }

        bridges: Array<Bridge>;
        determineCentrality(centralityType: CentralityType, households: Array<Household>, schools: Array<School>, offices: Array<Office>) {
            var gr = new MyGraph();
            schools.forEach(zz => gr.addNode(zz.location.ID, zz.location.label, 1, zz.location));
            offices.forEach(zz => gr.addNode(zz.location.ID, zz.location.label, 1, zz.location));
            this.bridges = this.determineBridges(households);
            for (var br of this.bridges) {
                gr.addEdge(br.location1.ID, br.location2.ID, br.ties.length);
            }
            if (centralityType == CentralityType.BETWEENNESS)
                gr.setNodeBetweennessCentrality();
            else
                gr.setNodeDegreeCentrality();
            gr.nodes.forEach(zz => (<Location>zz.tag).centralityHelper = zz.centrality);
        }

        determineDegreeCentralityMicro(households: Array<Household>, schools: Array<School>, offices: Array<Office>, recAreas: Array<RecreationArea>) {
            schools.forEach(zz => { zz.location.centralityHelper = 0; });
            offices.forEach(zz => { zz.location.centralityHelper = 0; });
            recAreas.forEach(zz => { zz.location.centralityHelper = 0; });

            for (var hh of households) {
                for (var ag of hh.family) {
                    ag.recareaFavorite.location.ID
                    if (ag.schoolNearestToHome != null)
                        ag.schoolNearestToHome.location.centralityHelper++;
                    if (ag.workingplace != null)
                        ag.workingplace.location.centralityHelper++;
                    if (ag.recareaFavorite != null)
                        ag.recareaFavorite.location.centralityHelper++;
                }
            }
        }
    }
}