/*
 * All modeling and programming by Ben Vermeulen (b.vermeulen@uni-hohenheim.de)
 * The software is licensed under the Creative Commons BY-NC-SA 4.0.
 * You are allowed to share and adapt but credits have to be given.
 */

module CBD {

    export class CBDGlobal {
        static MovementSpeed: number = 50;
        static MovementSpeedInfectionModerator: number = 0.5; // required because the probability infect is related to pixel distance, not real meters.. plus the movement in space and thereby rate at which agents 'run into' each other is random..
        static InfectiousnessModerator: number = 0.4; // required because there may be many encounters.. unintervened, the R0 should be 2.2 or there about..
        static NumberOfTicksPerGUIUpdate: number = 1;
        static TicksPerHour: number = 20;
        static TicksPerDay: number = CBDGlobal.TicksPerHour * 24;
        static InfectionDistance: number = 2; //
        static TicksSpreadEvent: number = 7 * CBDGlobal.TicksPerDay;
        static SimulationStopTicks: number = 100 * CBDGlobal.TicksPerDay;
        static imgDirectory: string = "./img/";
    }

    export var agentStateLabel =
        [ ["Susceptible",        "Gefährdete",                 "Vatbaar",                    "Susceptible",        "Suscettibili",        "総数",            "Susceptible",              "易受感染者", "Sain/ Susceptible", "尚未感染者", "고위험군" ],
          ["Exposed: latent",    "Ausgesetzte: latent",        "Blootgesteld: latent",       "Exposed: latent",    "Esposti: latente",    "潜在的な感染者数", "Expuesto: latente",        "暴露：潛在", "Exposition: latente", "潜在受感染者", "접촉자: 잠복기 자가격리"],
          ["Exposed: presympt.", "Ausgesetzte: präsympt.",     "Blootgesteld: presympt.",    "Exposed: presympt.", "Esposti: presympt.",  "発症前の感染者数", "Expuesto: presintomático", "暴露：潛伏期", "Exposition: présympt.", "潜伏期受感染者", "접촉자: 무증상자" ],
          ["Infected",           "Infizierte",                 "Geïnfecteerd",               "Infected",           "Infetti",             "発症後の感染者数", "Infectado",                "確診", "Infecté", "确诊", "감염자"],
          ["Infected: severe",   "Infiz.: Schwer Erkrankte",   "Geïnfecteerd: ernstig ziek", "Infected: severe",   "Infetti: severo",     "中度の感染者数",   "Infectado: severo",        "受感染：重症", "Infecté:sévère", "确诊：重症", "감염자: 중증"],
          ["Infected: critical", "Infiz.: Kritisch Erkrankte", "Geïnfecteerd: kritiek",      "Infected: critical", "Infetti: critico",    "重篤な感染者数",   "Infectado: crítico",       "受感染：病危", "Infecté: critique", "确诊：病危", "감염자: 최중증"],
          ["Recovered",          "Genesene",                   "Genezen",                    "Recovered",          "Ristabiliti",         "回復患者数",       "Recuperado",               "治癒", "Guéri/ Soigné", "康复/治愈", "완치자"],
          ["Deceased",           "Verstorbene",                "Overleden",                  "Deceased",           "Deceduti",            "死者数",           "Fallecido",                "死亡",    "Décédé", "死亡", "사망자"]];

    export var daysOfWeekLabel = [["Monday", "Montag", "Maandag", "Pazartesi", "Lunedì", "月曜", "Lunes", "星期一", "Lundi", "星期一", "월요일"], //       
        ["Tuesday", "Dienstag", "Dinsdag", "Salı", "Martedì", "火曜", "Martes", "星期二", "Mardi", "星期二", "화요일"],
        ["Wednesday", "Mittwoch", "Woensdag", "Çarşamba", "Mercoledì", "水曜", "Miércoles", "星期三", "Mercredi", "星期三", "수요일"],
        ["Thursday", "Donnerstag", "Donderdag", "Perşembe", "Giovedì", "木曜", "Jueves", "星期四", "Jeudi", "星期四", "목요일"],
        ["Friday", "Freitag", "Vrijdag", "Cuma", "Venerdì", "金曜", "Viernes", "星期五", "Vendredi", "星期五", "금요일"],
        ["Saturday", "Samstag", "Zaterdag", "Cumartesi", "Sabato", "土曜", "Sábado", "星期六", "Samedi", "星期六", "토요일"],
        ["Sunday", "Sonntag", "Zondag", "Pazar", "Domenica", "日曜", "Domingo", "星期日", "Dimanche", "星期日", "일요일"]];

    export enum DayOfWeek { Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday }
    export enum LocationType { HOME, OFFICE, SHOP, SUPERMARKET, SCHOOL, RECREATION, RESTAURANT, HOSPITAL, GRAVESITE, UNDEFINED }
    export enum AppointmentType { WORK, SCHOOL, SUPERMARKET, SHOPPING, RANDOMVISIT, RECREATION }
    export enum InfectionState { SUSCEPTIBLE, EXPOSED_LATENT, EXPOSED_PRESYMPTOMATIC, INFECTED, INFECTEDSEVERE, INFECTEDCRITICAL, RECOVERED, DECEASED }
    export enum MovementState { MOVING, STAYING }
    export enum OfficePolicy { COMEALWAYS, STAYHOMEWHENSICK, STAYHOMEALWAYS, CLOSEOFFICEANDLOCKEMPLOYEEHH }
    export enum HospitalizationPolicy { NONE, CRITICAL, SEVERE_AND_CRITICAL }
    export enum GatheringsPolicy { ALLOWED, PROHIBITED, CLOSEAREANDLOCKVISITORHH }
    export enum SchoolPolicy { COMEALWAYS, BARILL, CLOSESPECIFIC, CLOSESCHOOLANDLOCKPARENTS, CLOSEALL }
    export enum AgeGroup { AG15_19, AG20_29, AG30_39, AG40_49, AG50_59, AG60_69, AG70_79, AG80_89, AG90OVER }
    export enum ChildAgeSpec {
        Y0_5_O0_5, Y0_5_O6_11, Y0_5_O12_17, Y0_5_O18_24, Y0_5_O25o,
        Y6_11_O6_11, Y6_11_O12_17, Y6_11_O18_24, Y6_11_O25o,
        Y12_17_O12_17, Y12_17_O18_24, Y12_17_O25o,
        Y18_24_O18_24, Y18_24_O25o,
        Y25o_O25o,
    };
    export enum HouseholdType { S_0K, S_1K, S_2K, S_3K, C_0K, C_1K, C_2K, C_3K, MISC }
    enum SimulationControl { PAUSE, STEP, PLAY, FASTFORWARD, BIGSTEP, /*SUPERBIGSTEP,*/ SUPERFASTFORWARD }
    export enum Language { ENGLISH, GERMAN, DUTCH, TURKISH, ITALIAN, JAPANESE, SPANISH, TRADCHINESE, FRENCH, SIMPLCHINESE, KOREAN } // Don't change order: this is also the order of the languages in the label tables!

    export class Appointment {
        constructor(appointmentType: AppointmentType, dayOfWeek: DayOfWeek, beginHour: number, endHour: number, location: Location = null) {
            this.location = location;
            this.dayOfWeek = dayOfWeek;
            this.appointmentType = appointmentType;
            this.begin = beginHour * CBDGlobal.TicksPerHour;
            this.end = endHour * CBDGlobal.TicksPerHour;
        }
        setLocation(loc: Location) { this.location = loc; }
        getLocation(): Location {
            if (this.location == null)
                alert("Location not set for appointment");
            return this.location;
        }
        dayOfWeek: DayOfWeek;
        appointmentType: AppointmentType;
        private location: Location;
        begin: number;
        end: number;
    }

    export class Agenda {
        appointments = new Array<Appointment>();

        GetCurrentAppointment(t: number): Appointment {
            let _d: DayOfWeek = <DayOfWeek>Math.trunc((t % (7 * CBDGlobal.TicksPerDay)) / CBDGlobal.TicksPerDay);
            var _t = t % (24 * CBDGlobal.TicksPerHour);
            return this.appointments.find(zz => zz.dayOfWeek == _d && zz.begin <= _t && zz.end >= _t);
        }
    }

    export class Location {
        type: LocationType;
        label: string;
        ID: number;

        centralityHelper: number = 0; // at present only used for offices and schools
        blocklock: boolean = false; // both for blocking and locking..

        left: number;
        right: number;
        top: number;
        bottom: number;

        IsIn(x: number, y: number): boolean { return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom; }
        GetMidX(): number { return (this.left + this.right) / 2; }
        GetMidY(): number { return (this.top + this.bottom) / 2; }
        GetWidth(): number { return this.right - this.left; }
        GetHeight(): number { return this.bottom - this.top; }
        GetDistanceSquareToMid(x: number, y: number) {
            var dx = (this.GetMidX() - x);
            var dy = (this.GetMidY() - y);
            return dx * dx + dy * dy;
        }
    }

    export class SpecificLocationBase { location: Location; }

    export class Hospital extends SpecificLocationBase {
        id: string;
        nrBeds: number;
        patients: Array<Agent>;
    }

    export class Office extends SpecificLocationBase {
        label: string;
        employees: Array<Agent>;
        hasInfectedWorker: boolean;
    }

    export class School extends SpecificLocationBase {
        schoolchildren: Array<Agent>;
        hasInfectedChild: boolean;
    }

    export class RecreationArea extends SpecificLocationBase {
        visitors: Array<Agent>;
        hasInfectedVisitor: boolean;
    }

    export class Supermarket extends SpecificLocationBase {
        visitors: Array<Agent>;
    }

    export class Household extends SpecificLocationBase {
        label: string;
        family: Array<Agent>;

        __centralityBridgeHelper: number;
    }

    export class Statistics {
        nrSusceptible: number = 0;
        nrExposed_Latent: number = 0;
        nrExposed_Presymptomatic: number = 0;
        nrInfected: number = 0;
        nrInfectedSevere: number = 0;
        nrInfectedCritical: number = 0;
        nrDeceased: number = 0;
        nrRecovered: number = 0;

        effectiveLabor: number = 0;

        log(sep: string): string {
            var str = "" + this.effectiveLabor + sep + this.nrSusceptible + sep + this.nrExposed_Latent + sep + this.nrExposed_Presymptomatic + sep + this.nrInfected + sep +
                this.nrInfectedSevere + sep + this.nrInfectedCritical + sep + this.nrDeceased + sep + this.nrRecovered;
            return str;
        }
    }

    export class Simulation extends SimulationBase {

        
        guiLanguage: Language = Language.ENGLISH;
        control: SimulationControl = SimulationControl.PLAY;

        // Italian: Cristina Ponsiglione, Eleonora Psenner
        // German: Andreas Pyka, Eleonora Psenner
        // Chinese (Traditional & simplified): Bin-Tzong Chie
        // Turkish: Aykut Kibritçioğlu, Kurtulus Baris Oner
        // Japanese: Yasushi Hara
        // French: Nicolas Béfort
        // Korean: Bogang Jun
        // Spanish: Luis Rubalcaba Bermejo (UAH)
        labels = [
            ["button-pause", "TITLE", "Pauses the simulation", "Anhalten", "Pauseer de simulatie", "Benzetimi duraksat", "Pausa", "シミュレーションを中断する", "Pauses the simulation", "模擬暫停", "Mettre la simulation en pause", "模拟暂停", "정지"],
            ["button-step", "TITLE", "Small simulation step (15 min)", "Kleiner Schritt (15 min)", "Kleine simulatiestap (15 min)", "Küçük benzetim adımı (15 min)", "Piccolo passo della simulazione (15 min)", "シミュレーションを15分進める", "Small simulation step (15 min)", "模擬進行(15分鐘)", "Petit saut dans la simulation (15 min)", "逐步模拟(相当于15分钟)", "단기 시뮬레이션 (15분)"],
            ["button-bigstep", "TITLE", "Big simulation step (12 hours)", "Großer Schritt (12 Stunden)", "Grote simulatiestap (12 uur)", "Büyük benzetim adımı (12 hours)", "Grande passo della simulazione (12 ore)", "シミュレーションを半日進める", "Big simulation step (12 hours)", "模擬進行(12小時)", "Grand saut dans la simulation (12 heures)", "逐步模拟进行(相当于12小时)", "장기 시뮬레이션 (12시간)"],
            //["button-superbigstep", "TITLE", "Major simulation step (10 days)", "Supergroßer Schritt (10 Tage)", "Supergrote simulatiestap (10 dagen)", "Büyük benzetim adımı (10 days)", "Grandissimo passo della simulazione (10 giorni)", "シミュレーションを10日進める", "Major simulation step (10 days)", "模擬進行(10天)", "Saut important dans la simulation (10 jours)", "逐步模拟进行(10天)", "주 시뮬레이션 (10일)"],
            ["button-play", "TITLE", "Slow run", "Langsamer Verlauf", "Langzaam afspelen", "Yavaş çalıştır", "Avvio della simulazione", "ゆっくり進める", "Slow run", "慢速", "Simulation lente", "慢速", "저속"],
            ["button-fastforward", "TITLE", "Fast run", "Schneller Verlauf", "Versneld afspelen", "Hızlandır", "Simulazione veloce", "早く進める", "Fast run", "快速", "Simulation rapide", "快速", "고속"],
            ["button-superfastforward", "TITLE", "Superfast run", "Superschneller Verlauf", "Snel doorspoelen", "Çok hızlandır", "Simulazione velocissima", "最終日まで進める", "Superfast run", "極速", "Simulation très rapide", "极速", "초고속"],
            ["button-refresh", "TITLE", "Rerun the same simulation with same random number generator", "Neue Simulation mit gleichem Zufallsgenerator", "Herhaal deze simulatie met dezelfde toevalsgenerator", "Aynı benzetimi aynı rassal sayı üreticisiyle tekrar çalıştır", "Nuova simulazione con lo stesso generatore di numeri casuali", "同じランダム変数の生成条件で、同じシミュレーションを実行する", "Rerun the same simulation with same random number generator", "以同一亂數種子進行模擬重置", "Relancer la simulation avec le même générateur aléatoire", "以同一随机数种子重置模拟", "동일한 세대 수만큼 다시 돌리기"],
            ["button-new", "TITLE", "New simulation with different random number generator", "Neue Simulation mit neuem Zufallsgenerator", "Nieuwe simulatie met een andere toevalsgenerator", "Farklı bir rassal sayı üreticisiyle yeni benzetim", "Nuova simulazione con un nuovo generatore di numeri casuali", "異なるランダム変数を与えて、新たなシミュレーションを実施する", "New simulation with different random number generator", "以新亂數種子進行模擬重置", "Relancer la simulation avec générateur aléatoire différent", "以新随机数种子重置模拟", "다른 난수발생기로 새로운 시뮬레이션"],

            ["label_general_policy", "INNER", "General policy:", "Allgemeine Maßnahmen:", "Algemene beleidsmaatregelen:", "Genel önlemler:", "Misure di carattere generale:", "一般的な対策:", "Política general:", "一般政策:", "Mesures générales:", "一般政策:", "일반적인 안전대책:"],
            // ["label_travel_policy", "INNER", "Interregional travel policy:", "Maßnahmen interregionale Reise:", "Interregionaal inreisbeleid:", "Bölgelerarası seyahat önlemleri:", "Misure sui viaggi interregionali:", "JAPANESE", "SPANISH", "跨區域旅行政策:", "Politique de circulation interrégionale:", "跨区域旅行政策:", "지역간 이동 제한:"],
            ["label_policy_physicalmeasures", "INNER", "Physical measures: distance/ hygiene/ coughing", "Physische Maßnahmen: Hustenetikette, Abstand und Händewaschen", "Fysieke maatregelen: afstand/ hygiëne/ hoesten", "Fiziksel önlemler: öksürük, mesafe ve el yıkama", "Misure di carattere fisico: distanziamento/igiene/tosse", "物理的な対策 : 社会的距離(2m)の確立/衛生対策/咳払いの抑止", "Medidas físicas: distancia/ higiene/ tos", "實體措施：距離/衛生/咳嗽", "Mesures physiques: distance/hygiène/toux", "实体措施：保距/卫生/咳嗽礼节", "행동수칙:거리두기/개인위생/기침예절"],
            ["label_policy_travel", "INNER", "Interregional travel policy: refuse incoming travelers", "Maßnahmen interregionale Reise: eingehende Reisende ablehnen", "Interregionaal inreisbeleid: inkomende reizigers weren", "Bölgelerarası seyahat önlemleri: Gelen yolcuları reddet", "Misure sui viaggi interregionali: rifiutare i viaggiatori dall’esterno", "地域間の移動 : 旅行者の受け入れ拒否", "Política de viajes interregionales: Rechazar a los viajeros entrantes", "跨區域旅行政策：拒絕旅客入境", "Politique de circulation interrégionale: refus des voyageurs entrants", "跨区域旅行政策：拒绝旅客入境", "지역간 이동제한"],
            
            ["label_school_policy", "INNER", "School policy:", "Maßnahmen für Schulen:", "Schoolbeleid:", "Okullar için önlemler:", "Misure riguardanti la scuola:", "教育機関の対策:", "Política escolar:", "校園政策:", "Mesures scolaires:", "校园政策:", "학교 정책:"],
            ["label_policy_school_none", "INNER", "None: come to school regardless", "Keine besonderen Maßnahmen", "Geen: gewoon naar school komen", "Özel önlem yok: ne olursa olsun okula gelin", "Nessuna restrizione: scuole sempre aperte", "なし: すべての通学を許可する", "Ninguna: ir a la escuela normalmente", "無：正常上課", "Pas de mesures particulières", "无：正常上课", "없음: 정상등교"],
            ["label_policy_school_barill", "INNER", "Bar the ill from entering school", "Infizierte Schüler bleiben zu Hause", "Verbied zieken naar school te komen", "Enfekte öğrenciler evde kalır", "Impedire ai malati di entrare a scuola", "疾患を持つ学生/教職員の通学を禁止", "Prohibir que los enfermos entren a la escuela", "有感冒症狀者勿進入校園", "Seuls les malades ne vont pas à l'école", "有感冒症状者勿进入校园", "유증상자 등교금지"],
            ["label_policy_school_closespecific", "INNER", "Close school upon first infected", "Schulschließung bei Krankheitsfall", "Schoolsluiting bij eerste zieke", "Hastalık durumunda okulun kapatılması", "Chiudere la scuola al primo infetto", "感染者が発生次第学校を封鎖する", "Cerrar la escuela luego del primer contagio", "一有確診者即關閉校園", "Ecole fermée dès le premier malade", "一有确诊者即关闭校园", "유증상자 발생 시 휴교"],
            ["label_policy_school_closeschoolandlockparents", "INNER", "Close for one case and isolate households", "Individuelle Schulschließung und Isolation der Familie", "Schoolsluiting bij eerste plus isoleer huishoudens", "Bireysel okul kapatma ve aile izolasyon", "Chiudere al primo caso e isolare i familiari", "感染者が発生した場合自宅待機を行う", "Cerrar al primer caso y aislar a los miembros de la familia", "有確診者即關閉校園並隔離全家人", "Ecole fermée dès le premier cas et mise en quarantaine de la famille", "有确诊者即关闭校园并隔离全家人", "유증상자 발생 시 휴교 및 학생가족 자가격리"],
            ["label_policy_school_closeall", "INNER", "Close all schools", "Schließung aller Schulen", "Houd alle scholen gesloten", "Tüm okulların kapatılması", "Chiudere tutte le scuole", "すべての学校を封鎖する", "Cerrar todas las escuelas", "關閉所有校園", "Fermeture de toutes les écoles", "关闭所有校园", "모든 학교 휴교"],

            ["label_hospitalization_policy", "INNER", "Hospitalization policy:", "Maßnahmen für Krankenhäuser:", "Ziekenhuisbeleid:", "Hastaneler için önlemler (Hasta kabul kuralları):", "Misure per l’ospedalizzazione:", "患者の受入方針:", "Política de hospitalización:", "醫療院所政策:", "Mesures d’hospitalisation:", "医疗院所政策:", "병상 관리정책:"],
            ["label_policy_hospitalization_none", "INNER", "No special admission rules", "Keine besonderen Maßnahmen", "Geen bijzondere opnameregels", "Özel önlem veya kabul kuralı yok ", "Nessuna regola di ammissione speciale", "特別な入院規定なし", "No hay reglas especiales de admisión", "無入院限制", "Pas de mesures d’admissions particulières", "无入院限制", "병상관리정책 없음"],
            ["label_policy_hospitalization_critical", "INNER", "Admit only critical cases", "Aufnahme kritischer Fälle (ausschließlich)", "Neem kritieke gevallen op (uitsluitend)", "Kritik vakalar kabul edilsin", "Ammettere solo pazienti in condizioni critiche ", "重篤患者に対応", "Admitir sólo los casos críticos", "僅接受病危患者", "Admission des seuls cas critiques", "仅接受病危患者", "중증 이상 환자만 입원 가능"],
            ["label_policy_hospitalization_several_and_critical", "INNER", "Admit both severe and critical cases", "Aufnahme schwerer und kritischer Fälle", "Neem zowel zware als kritieke gevallen op", "Ciddi ve kritik vakalar kabul edilsin", "Ammettere pazienti in condizioni severe e critiche", "中程度および重篤患者に対応", "Admitir sólo los casos críticos y severos", "僅接受重病與病危患者", "Admission des cas sévères et critiques", "仅接受重病与病危患者", "최중증 이상 환자만 입원 가능"],
            ["label_hospital_capacity", "INNER", "Hospital capacity", "Krankenhauskapazität", "Ziekenhuiscapaciteit", "Hastane kapasitesi", "Capacità degli ospedali", "病院のキャパシティ", "Capacidad de los hospitales", "醫療院所容量", "Capacité des hôpitaux", "医疗院所容量", "확보 병상"],

            ["label_office_policy", "INNER", "Office policy:", "Maßnahmen für Unternehmen:", "Kantoorbeleid:", "Şirketler için önlemler:", "Misure relative al lavoro:", "企業の対策:", "Políticas relativas al trabajo:", "上班政策:", "Mesure pour les entreprises:", "上班政策:", "재택 근무 정책:"],
            ["label_policy_office", "INNER", "None: come to the office regardless", "Keine besonderen Maßnahmen", "Geen: gewoon naar kantoor komen", "Özel önlem yok", "Consentire sempre l’accesso ai luoghi di lavoro", "なし; 通常通りの出勤を許可する", "Ninguna: ir al trabajo normalmente", "無：正常上班", "Pas de mesures particulières", "无：正常上班", "없음: 재택근무 불가능"],
            ["label_policy_office_stayhomewhensick", "INNER", "Stay and work from home when sick", "Home-Office im Krankheitsfall", "Werk vanuit thuis indien ziek", "Hastalık durumunda evden çalışma (ev-ofisi)", "I lavoratori malati restano e lavorano da casa", "体調が優れない場合在宅勤務を許可する", "Cuando se está enfermo quedarse en casa y hacer teletrabajo", "有感冒症狀者在家上班", "Télétravail si malade", "有感冒症状者居家上班", "유증상자 재택근무"],
            ["label_policy_office_workfromhome", "INNER", "Work from home regardless (when possible)", "Home-Office für alle (wenn möglich)", "Werk hoe dan ook thuis (indien mogelijk)", "Herkes için evden çalışma (mümkünse)", "Il lavoro deve essere svolto sempre da casa", "可能な限り、在宅勤務に切り替える", "Trabajar desde casa (cuando sea posible)", "盡可能在家上班", "Télétravail généralisé", "尽可能在家上班", "모든 근무자 재택근무 (가능한 경우)"],

            ["label_gatherings_policy", "INNER", "Gathering policy:", "Maßnahmen für Großveranstaltungen:", "Samenscholingsbeleid:", "Büyük toplantılar için önlemler:", "Misure relative agli incontri:", "集まりへの対策:", "Medidas relativas al encuentro entre personas", "集會政策:", "Mesures sur les regroupements", "集会政策:", "모임 및 집회에 관한 정책:"],
            ["label_policy_gatherings_allowed", "INNER", "Gatherings allowed", "Großveranstaltungen zulässig", "Samenscholen toegestaan", "Büyük toplantılara izin verilir", "Gli incontri tra persone sono sempre consentiti", "集会やイベントを許可する", "Encuentro entre personas permitido", "正常集會", "Regroupements autorisés", "正常集会", "모임 및 집회 허용"],
            ["label_policy_gatherings_disallowed", "INNER", "Gatherings prohibited", "Großveranstaltungen verboten", "Samenscholen verboden", "Büyük toplantılar yasak", "Gli incontri tra persone sono proibiti", "集会やイベントを許可しない", "Encuentro entre personas prohibido", "禁止集會", "Regroupements interdits", "禁止集会", "모임 및 집회 금지"],

            ["label_locality_house", "INNER", "House [in residential area]", "Wohnhaus [im Wohngebiet]", "Woonhuis [in woonwijk]", "Konut [yerleşim bölgesinde]", "Abitazione [in area residenziale]", "住宅地 [住宅街]", "Casas [en áreas residenciales]", "住所 [居住區]", "Maison [dans une zone résidentielle]", "住所 [居住区]", "주거공간 [주거지역 내]"],
            ["label_locality_school", "INNER", "School [in residential area]", "Schule [im Wohngebiet]", "School [in woonwijk]", "Okul [yerleşim bölgesinde]", "Scuola [in area residenziale]", "学校[住宅街]", "Escuelas [en áreas residenciales]", "校園 [居住區]", "Ecole  [dans une zone résidentielle]", "校园 [居住区]", "학교 [주거지역 내]"],
            ["label_locality_workplace", "INNER", "Workspace [in industrial area]", "Arbeitsbereich [im Gewerbegebiet]", "Kantoor/ fabriek [op bedrijventerrein]", "Çalışma alanı [endüstriyel alanda]", "Spazio di lavoro [in area industriale]", "オフィス [中心街]", "Espacios de trabajo [en áreas industriales]", "工作地 [工業區]", "Lieu de travail [dans une zone industrielle]", "工作地 [工业区]", "업무공간 [공업지역 내]"],
            ["label_locality_recreationarea", "INNER", "Recreation area", "Erholungsgebiet", "Recreatiegebied", "Rekreasyon alanı", "Area ricreativa", "公園", "Áreas de recreación", "休憩場所", "Espace de loisir", "休憩场所", "유흥공간"],
            ["label_locality_shop", "INNER", "Supermarket / shop [in commercial area]", "Supermarkt [im Gewerbegebiet]", "Winkel [in winkelstraat]", "Süpermarket [endüstriyel alanda]", "Supermercato/negozio [in area commerciale]", "スーパーマーケット [商業地]", "Supermercados / tiendas [en áreas comerciales]", "超市/商店 [商業區]", "Supermarché [dans une zone commerciale]", "超市/商店 [商业区]", "마트/상점 [상업지역 내]"],
            ["label_locality_hospital", "INNER", "Hospital [in designated spot]", "Krankenhaus [ausgewiesener Platz]", "Ziekenhuis [op aangewezen plek]", "Hastane [belirlenmiş yer]", "Ospedale [in punto designato]", "病院", "Hospitales [en lugares designados]", "醫院 [指定地點]", "Hôpital [dans un espace désigné]", "医院 [指定地点]", "병원 [지정된 장소]"],
            ["label_locality_cemetery", "INNER", "Cemetery (possibly with graves) ", "Friedhof (vielleicht mit Gräbern)", "Begraafplaats (mogelijk met graven)", "Mezarlık (belki mezarlı)", "Cimitero [possibilmente con tombe]", "墓地", "Cementerios (posiblemente con tumbas)", "公墓（墳墓）", "Cimetière (pouvant contenir des tombes)", "公墓（坟墓）", "묘역 (무덤 등)"],

            ["page_title", "INNER", "An agent-based policy laboratory for COVID-19 containment strategies",
                "Ein Politiklabor zum Test unterschiedlicher gesundheitspolitischer Instrumente zur Eindämmung der COVID-19 Epidemie",
                "Een agent-gebaseerd laboratorium voor beleidsmaatregelen ter indamming van de COVID-19 epidemie",
                "COVID-19 Salgının Dizginlenmesi İçin Farklı Sağlık Politikası Araçlarının Sınanmasına Yönelik Bir Politika Laboratuvarı",
                "Un laboratorio basato su agenti di supporto alle strategie di contenimento del COVID-19",
                "COVID-19 封じ込め戦略立案のためのエージェントベースドモデル",
                "Laboratorio de políticas basado en agentes para estrategias de contención del COVID-19",
                "代理人基新冠病毒(COVID-19)防治政策實驗室",
                "Un laboratoire politique d’analyse des stratégies de confinement contre le COVID-19 par une analyse basée sur les agents",
                "代理人基新冠病毒(COVID-19)防治政策实验室",
                "코로나바이러스감염증-19 방역전략 및 정책을 위한 행위자 기반 모델"
            ],

            ["label_labor_volume", "INTERNAL", "Labor volume", "Arbeitsvolumen", "Arbeidsvolume", "İş hacmi", "Volume di lavoro", "総労働量", "Volumen Laboral", "勞動量", "Volume de travail", "劳动量", "노동가능 인구 규모"]
        ];


        setLanguage(lang: Language) {
            this.guiLanguage = lang;
            var i = lang;
            for (var message of this.labels) {
                var element = document.getElementById(message[0]) as HTMLInputElement;
                switch (message[1]) {
                    case "TITLE": element.title = message[2 + i]; break;
                    case "INNER": element.innerHTML = message[2 + i]; break;
                }
            }

            this.world.language = lang;
            this.setGraphMessage();
            this.setGraphTitle();
            this.stackedgraph.draw(true, true);
            this.linegraph.draw();
        }

        setGraphTitle() {
            var label = this.labels.find(zz => zz[0] == "label_labor_volume");
            this.linegraph.title = label[this.guiLanguage+2];
        }

        setGraphMessage() {
            var label = this.labels.find(zz => zz[0] == "label_hospital_capacity");
            let rICU = document.getElementById("ICU_capacity") as HTMLInputElement;
            var ICUCapacity = +rICU.value;
            this.stackedgraph.setThresholdLine(ICUCapacity, label[this.guiLanguage + 2]);
        }

        stackedgraph: StackedGraph;
        linegraph: Graph;
        histogram: HistogramWrapper
        ctx: CanvasRenderingContext2D;
        
        constructor() {
            super();

            var canvas = <HTMLCanvasElement>document.getElementById("worldcanvas");
            this.ctx = canvas.getContext("2d");
            this.constructWorld();

            this.simulationStopTicks = CBDGlobal.SimulationStopTicks;
            if (this.wasSFF)
                this.control = SimulationControl.SUPERFASTFORWARD;
            this.setLanguage(this.guiLanguage);

            var defaultICUCapacity = 5;
            let rICU = document.getElementById("ICU_capacity") as HTMLInputElement;
            rICU.addEventListener("click", (e: Event) => {
                var ICUCapacity = +rICU.value;
                this.world.setTotalICUCapacity(ICUCapacity);
                window.requestAnimationFrame(() => {
                    this.setGraphMessage();
                    this.stackedgraph.draw(true, true);
                });
            });
            defaultICUCapacity = +rICU.value;
            this.world.setTotalICUCapacity(defaultICUCapacity);

            let cbPhysMeas = document.getElementById("policy_physicalmeasures") as HTMLInputElement;
            cbPhysMeas.addEventListener("click", (e: Event) => { this.world.policyPhysicalMeasures = cbPhysMeas.checked; });

            let cbTravelPolicy = document.getElementById("policy_traveling") as HTMLInputElement;
            cbTravelPolicy.addEventListener("click", (e: Event) => {
                this.world.setPolicyInterregionalTravel(!cbTravelPolicy.checked);
            });


            // for own testing purposes right now..
            let cbSNA = document.getElementById("allow_SNA") as HTMLInputElement;
            if (cbSNA != null)
                cbSNA.addEventListener("click", (e: Event) => { this.world.showToggleSNA = cbSNA.checked; });

            var fieOffice = (e: Event) => { this.world.setOfficePolicy((<HTMLInputElement>document.querySelector('input[name="policy_office"]:checked')).value); }
            var fieHospital = (e: Event) => {
                var val = (<HTMLInputElement>document.querySelector('input[name="policy_hospitalization"]:checked')).value; this.world.setHospitalizationPolicy(val);
                this.stackedgraph.yThresholdLineShow = (val == "critical" || val == "severe_and_critical");
                this.stackedgraph.draw(true, true);
            }
            var fieGathering = (e: Event) => { this.world.setGatheringsPolicy((<HTMLInputElement>document.querySelector('input[name="policy_gatherings"]:checked')).value); }
            var fieSchool = (e: Event) => { this.world.setSchoolPolicy((<HTMLInputElement>document.querySelector('input[name="policy_school"]:checked')).value); }

            document.getElementById("language-DE").addEventListener("click", () => { this.setLanguage(Language.GERMAN); });
            document.getElementById("language-EN").addEventListener("click", () => { this.setLanguage(Language.ENGLISH); });
            document.getElementById("language-NL").addEventListener("click", () => { this.setLanguage(Language.DUTCH); });
            document.getElementById("language-TR").addEventListener("click", () => { this.setLanguage(Language.TURKISH); });
            document.getElementById("language-IT").addEventListener("click", () => { this.setLanguage(Language.ITALIAN); });
            document.getElementById("language-JP").addEventListener("click", () => { this.setLanguage(Language.JAPANESE); });
            document.getElementById("language-ES").addEventListener("click", () => { this.setLanguage(Language.SPANISH); });
            document.getElementById("language-TW").addEventListener("click", () => { this.setLanguage(Language.TRADCHINESE); });
            document.getElementById("language-FR").addEventListener("click", () => { this.setLanguage(Language.FRENCH); });
            document.getElementById("language-CN").addEventListener("click", () => { this.setLanguage(Language.SIMPLCHINESE); });
            document.getElementById("language-KR").addEventListener("click", () => { this.setLanguage(Language.KOREAN); });

            document.getElementById("policy_office_come").addEventListener("click", fieOffice);
            document.getElementById("policy_office_stayhomewhensick").addEventListener("click", fieOffice);
            document.getElementById("policy_office_workfromhome").addEventListener("click", fieOffice);

            document.getElementById("policy_hospitalization_none").addEventListener("click", fieHospital);
            document.getElementById("policy_hospitalization_critical").addEventListener("click", fieHospital);
            document.getElementById("policy_hospitalization_severe_and_critical").addEventListener("click", fieHospital);

            document.getElementById("policy_gatherings_allowed").addEventListener("click", fieGathering);
            document.getElementById("policy_gatherings_disallowed").addEventListener("click", fieGathering);

            document.getElementById("policy_school_none").addEventListener("click", fieSchool);
            document.getElementById("policy_school_barill").addEventListener("click", fieSchool);
            document.getElementById("policy_school_closespecific").addEventListener("click", fieSchool);
            document.getElementById("policy_school_closeschoolandlockparents").addEventListener("click", fieSchool);
            document.getElementById("policy_school_closeall").addEventListener("click", fieSchool);

            var controlfie = (e: MouseEvent) => {
                var t = (e.currentTarget as Element).id;
                switch (t) {
                    case "button-pause": this.control = SimulationControl.PAUSE; break;
                    case "button-step": this.control = SimulationControl.STEP; break;
                    case "button-play": this.control = SimulationControl.PLAY; break;
                    case "button-bigstep": this.control = SimulationControl.BIGSTEP; break;
                   // case "button-superbigstep": this.control = SimulationControl.SUPERBIGSTEP; break;
                    case "button-fastforward": this.control = SimulationControl.FASTFORWARD; break;
                    case "button-superfastforward": this.control = SimulationControl.SUPERFASTFORWARD; break;
                }
            }

            this.control = SimulationControl.PLAY;
            document.getElementById("button-pause").addEventListener("click", controlfie);
            document.getElementById("button-step").addEventListener("click", controlfie);
            document.getElementById("button-play").addEventListener("click", controlfie);
            document.getElementById("button-bigstep").addEventListener("click", controlfie);
           // document.getElementById("button-superbigstep").addEventListener("click", controlfie); // "button-superbigstep"
            document.getElementById("button-fastforward").addEventListener("click", controlfie);
            document.getElementById("button-superfastforward").addEventListener("click", controlfie);

            var initfie = (e: MouseEvent) => {

                var t = (e.currentTarget as Element).id;
                var preincreaseseed = false;
                if (t == "button-new") {
                    this.world.blockedLocations = null;
                    preincreaseseed = true;

                } else if (t == "button-refresh") {
                    this.world.blockedLocations = [];
                    for (var loc of this.world.sites.filter(zz => zz.type == LocationType.SCHOOL || zz.type == LocationType.OFFICE || zz.type == LocationType.RECREATION || zz.type == LocationType.HOME)) {
                        if (loc.blocklock) this.world.blockedLocations.push(loc.ID); // this memorization will only work as long as the IDs remain the same upon refresh..
                    }
                }

                let rICU = document.getElementById("ICU_capacity") as HTMLInputElement;
                var icucap = +rICU.value;
                this.world.init(this.ctx, preincreaseseed, icucap, this.stylizedMap, this.includeRecAreasCentrality);

                this.world.draw();// just one, to update when renewing/ refreshing something while paused..

                this.simulationStopTicks = CBDGlobal.SimulationStopTicks;
                if (this.wasSFF)
                    this.control = SimulationControl.SUPERFASTFORWARD;

                this.world.policyPhysicalMeasures = cbPhysMeas.checked;
                this.world.setPolicyInterregionalTravel(!cbTravelPolicy.checked);
                this.world.setGatheringsPolicy((<HTMLInputElement>document.querySelector('input[name="policy_gatherings"]:checked')).value);


                var val = (<HTMLInputElement>document.querySelector('input[name="policy_hospitalization"]:checked')).value;
                this.world.setHospitalizationPolicy(val);
                this.stackedgraph.yThresholdLineShow = (val == "critical" || val == "severe_and_critical");

                this.world.setOfficePolicy((<HTMLInputElement>document.querySelector('input[name="policy_office"]:checked')).value)
                this.world.setSchoolPolicy((<HTMLInputElement>document.querySelector('input[name="policy_school"]:checked')).value)
                this.stackedgraph.init();
                this.stackedgraph.tMax = 10;

                this.linegraph.init(zz => { return '#ff0000'; });
                this.linegraph.valueMax = this.world.getMaxTotalEffectiveLabor();
                this.linegraph.tMax = 10;
                this.linegraph.yShowTicks = true;
                this.linegraph.setPctYTicks(3); // 25, 50, 75%

                this.histogram.init();
            }

            document.getElementById("button-refresh").addEventListener("click", initfie);
            document.getElementById("button-new").addEventListener("click", initfie);

        }


        simulationStopTicks: number = 0;
        wasSFF: boolean = false;

        run() {
            this.drawWorld();

            if (this.control != SimulationControl.PAUSE) {
      
                this.simulationSpeed = CBDGlobal.NumberOfTicksPerGUIUpdate;
                var pauseAfter = false; this.wasSFF = false;
                switch (this.control) {
                    case SimulationControl.STEP: this.simulationSpeed = CBDGlobal.NumberOfTicksPerGUIUpdate * CBDGlobal.TicksPerHour * 0.25; pauseAfter = true; break;
                    case SimulationControl.BIGSTEP: this.simulationSpeed = CBDGlobal.NumberOfTicksPerGUIUpdate * CBDGlobal.TicksPerDay * 0.5; pauseAfter = true; break;
                    // <button type="button" id="button-superbigstep" style="display:inline;" title="Major simulations step (50 days)"><img src=".\img\button-superbigstep.png" id="img-button-superbigstep" /></button>
                    //case SimulationControl.SUPERBIGSTEP: this.simulationSpeed = CBDGlobal.NumberOfTicksPerGUIUpdate * CBDGlobal.TicksPerDay * 10; pauseAfter = true; break;
                    case SimulationControl.PLAY: this.simulationSpeed = CBDGlobal.NumberOfTicksPerGUIUpdate; break;
                    case SimulationControl.FASTFORWARD: this.simulationSpeed = 5 * CBDGlobal.NumberOfTicksPerGUIUpdate; break;
                    case SimulationControl.SUPERFASTFORWARD:
                        this.wasSFF = true; 
                        this.simulationSpeed = 500 * CBDGlobal.NumberOfTicksPerGUIUpdate; break;
                }

                for (var n = 0; n < this.simulationSpeed; n++) {

                    if (this.shouldSaveData()) {
                        var stats = this.world.getStatistics();
                        this.updateGraphics(stats);
                    }

                    this.world.step();

                    if (this.wasSFF && this.world.time >= this.simulationStopTicks) {
                        this.simulationStopTicks += CBDGlobal.SimulationStopTicks;
                        this.control = SimulationControl.PAUSE;
                        break;
                    }
                }
                if (pauseAfter) this.control = SimulationControl.PAUSE;
            }

            window.requestAnimationFrame(() => this.run());
        }
    }
    
}

window.onload = () => {

    var simulation = new CBD.Simulation();
    simulation.run(); 

/*    
    var exp = CBD.MCExperiment.TRACELAYER;
    var tset = CBD.SettingMoment.IMMEDIATELY;
    var simulation = new CBD.SimulationMonteCarlo();    
    simulation.mcExperimentSetup(exp);
    simulation.mcExperimentRun(exp, tset, true);
  */  
};


