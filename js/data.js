/**
 * JK NOOVA - Datos iniciales y Servicio de Almacenamiento Local (LocalStorage)
 */

const STORAGE_KEY_PLAYERS = 'jknoova_players_v1';
const STORAGE_KEY_TEAMS = 'jknoova_teams_v1';
const STORAGE_KEY_EVENTS = 'jknoova_events_v1';
const STORAGE_KEY_TRANSPORT = 'jknoova_transport_v1';
const STORAGE_KEY_ATTENDANCE = 'jknoova_attendance_v1';
const STORAGE_KEY_TRAININGS = 'jknoova_trainings_v1';

// Equipos y grupos de entrenamiento predeterminados con sus códigos de color oficiales
const DEFAULT_TEAMS = [
  {
    id: 'team_jmk',
    name: 'JMK Kindergarten',
    shortName: 'JMK',
    category: 'Iniciación (4-5 años)',
    color: '#f97316', // Naranja
    description: 'Grupo formativo y psicomotricidad de iniciación.'
  },
  {
    id: 'team_u8',
    name: 'U8 Competición',
    shortName: 'U8',
    category: 'Prebenjamín (6-7 años)',
    color: '#ef4444', // Rojo
    description: 'Fútbol 7 formativo y competición base.'
  },
  {
    id: 'team_u10',
    name: 'U10 Competición',
    shortName: 'U10',
    category: 'Benjamín (8-9 años)',
    color: '#3b82f6', // Azul
    description: 'Competición liguera y torneos de fin de semana.'
  },
  {
    id: 'team_u12',
    name: 'U12 Competición',
    shortName: 'U12',
    category: 'Alevín (10-11 años)',
    color: '#10b981', // Verde
    description: 'Fútbol 8 / Fútbol 11 transición táctica.'
  },
  {
    id: 'team_u14',
    name: 'U14 Competición',
    shortName: 'U14',
    category: 'Infantil (12-13 años)',
    color: '#8b5cf6', // Púrpura
    description: 'Fútbol 11 federado y preparación física.'
  }
];

// Jugadores de demostración para JK Noova
const DEFAULT_PLAYERS = [
  // --- U10 Competición (Azul) ---
  {
    id: 'p_u10_1',
    name: 'Mateo',
    lastName: 'Silva Ruiz',
    nickname: 'El Mago',
    birthDate: '2016-04-12',
    teamId: 'team_u10',
    mainDorsal: 10,
    secondaryDorsal: 8,
    mainPosition: 'MCO',
    secondaryPosition: 'EI',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Carlos Silva',
      phone: '+34 611 223 344',
      email: 'carlos.silva@email.com'
    },
    medicalNotes: 'Ninguna alergia conocida. Ficha médica en regla.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-10', text: 'Gran visión de juego y precisión en pases filtrados. Trabajar repliegue tras pérdida.' }
    ]
  },
  {
    id: 'p_u10_2',
    name: 'Lucas',
    lastName: 'Gómez Vidal',
    nickname: 'El Rayo',
    birthDate: '2016-07-25',
    teamId: 'team_u10',
    mainDorsal: 7,
    secondaryDorsal: 11,
    mainPosition: 'ED',
    secondaryPosition: 'DC',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Laura Vidal',
      phone: '+34 622 334 455',
      email: 'laura.vidal@email.com'
    },
    medicalNotes: 'Alergia a los frutos secos (lleva antihistamínico en la mochila).',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-02-18', text: 'Velocidad excepcional por banda derecha. Mejorar la toma de decisiones en el área.' }
    ]
  },
  {
    id: 'p_u10_3',
    name: 'David',
    lastName: 'Martínez Sanz',
    nickname: 'La Roca',
    birthDate: '2016-02-08',
    teamId: 'team_u10',
    mainDorsal: 4,
    secondaryDorsal: 3,
    mainPosition: 'DFC',
    secondaryPosition: 'MCD',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Roberto Martínez',
      phone: '+34 633 445 566',
      email: 'roberto.martinez@email.com'
    },
    medicalNotes: 'Asma por esfuerzo leve. Lleva inhalador Ventolín antes de los partidos.',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-03-01', text: 'Líder vocal en la zaga. Gran anticipación aérea y corte limpio.' }
    ]
  },
  {
    id: 'p_u10_4',
    name: 'Álex',
    lastName: 'Navarro Soto',
    nickname: 'Pulpo',
    birthDate: '2016-09-14',
    teamId: 'team_u10',
    mainDorsal: 1,
    secondaryDorsal: 13,
    mainPosition: 'POR',
    secondaryPosition: 'POR',
    foot: 'Zurdo',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Elena Soto',
      phone: '+34 644 556 677',
      email: 'elena.soto@email.com'
    },
    medicalNotes: 'Usa lentillas desechables para jugar.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-12', text: 'Reflejos sobresalientes bajo palos. Mejorando juego de pies y salida por alto.' }
    ]
  },
  {
    id: 'p_u10_5',
    name: 'Bruno',
    lastName: 'Fernández Mora',
    nickname: 'Tanque',
    birthDate: '2016-05-19',
    teamId: 'team_u10',
    mainDorsal: 9,
    secondaryDorsal: 19,
    mainPosition: 'DC',
    secondaryPosition: 'MCO',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Marcos Fernández',
      phone: '+34 655 667 788',
      email: 'marcos.fm@email.com'
    },
    medicalNotes: 'Sin antecedentes médicos ni alergias.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-05', text: 'Eficacia de cara a portería. Físicamente muy potente para su categoría.' }
    ]
  },
  {
    id: 'p_u10_6',
    name: 'Nico',
    lastName: 'Pérez Cano',
    nickname: 'Flecha',
    birthDate: '2016-11-03',
    teamId: 'team_u10',
    mainDorsal: 3,
    secondaryDorsal: 14,
    mainPosition: 'LI',
    secondaryPosition: 'EI',
    foot: 'Zurdo',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Sofía Cano',
      phone: '+34 666 778 899',
      email: 'sofia.cano@email.com'
    },
    medicalNotes: 'Intolerancia a la lactosa severa.',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-02-28', text: 'Lateral zurdo con gran profundidad ofensiva y buen centro.' }
    ]
  },
  {
    id: 'p_u10_7',
    name: 'Samuel',
    lastName: 'Morales Gil',
    nickname: 'Samu',
    birthDate: '2016-08-30',
    teamId: 'team_u10',
    mainDorsal: 6,
    secondaryDorsal: 5,
    mainPosition: 'MC',
    secondaryPosition: 'MCD',
    foot: 'Ambidiestro',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Daniel Morales',
      phone: '+34 677 889 900',
      email: 'dani.morales@email.com'
    },
    medicalNotes: 'Sin incidencias médicas.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-08', text: 'Equilibrio defensivo-ofensivo en la medular. Dominio con ambas piernas.' }
    ]
  },
  {
    id: 'p_u10_8',
    name: 'Iker',
    lastName: 'López Vega',
    nickname: 'Muro',
    birthDate: '2016-01-15',
    teamId: 'team_u10',
    mainDorsal: 2,
    secondaryDorsal: 12,
    mainPosition: 'LD',
    secondaryPosition: 'DFC',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Carmen Vega',
      phone: '+34 688 990 011',
      email: 'carmen.vega@email.com'
    },
    medicalNotes: 'Sin incidencias médicas.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-02-20', text: 'Muy riguroso en la marca individual. Excelente resistencia.' }
    ]
  },
  {
    id: 'p_u10_9',
    name: 'Hugo',
    lastName: 'Romero Pastor',
    nickname: 'Chispita',
    birthDate: '2016-10-22',
    teamId: 'team_u10',
    mainDorsal: 11,
    secondaryDorsal: 17,
    mainPosition: 'EI',
    secondaryPosition: 'DC',
    foot: 'Zurdo',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Ana Pastor',
      phone: '+34 699 001 122',
      email: 'ana.pastor@email.com'
    },
    medicalNotes: 'Alergia al polen en primavera.',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-03-02', text: 'Desborde explosivo en el 1 contra 1. Buena definición cruzada.' }
    ]
  },
  {
    id: 'p_u10_10',
    name: 'Adrián',
    lastName: 'Torres Ibáñez',
    nickname: 'Motor',
    birthDate: '2016-06-11',
    teamId: 'team_u10',
    mainDorsal: 8,
    secondaryDorsal: 16,
    mainPosition: 'MC',
    secondaryPosition: 'MCO',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Víctor Torres',
      phone: '+34 612 345 678',
      email: 'victor.torres@email.com'
    },
    medicalNotes: 'Sin alergias ni lesiones recientes.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-14', text: 'Gran despliegue de kilómetros y llegada desde segunda línea.' }
    ]
  },

  // --- U8 Competición (Rojo) ---
  {
    id: 'p_u8_1',
    name: 'Gael',
    lastName: 'Campos Leal',
    nickname: 'Bala',
    birthDate: '2018-05-14',
    teamId: 'team_u8',
    mainDorsal: 9,
    secondaryDorsal: 7,
    mainPosition: 'DC',
    secondaryPosition: 'ED',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Raquel Leal',
      phone: '+34 623 456 789',
      email: 'raquel.leal@email.com'
    },
    medicalNotes: 'Alergia a las picaduras de avispa (lleva Urbasón).',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-03-09', text: 'Mucha ilusión y entusiasmo. Muy rápido al contraataque.' }
    ]
  },
  {
    id: 'p_u8_2',
    name: 'Pablo',
    lastName: 'Herrera Ortiz',
    nickname: 'Guardián',
    birthDate: '2018-09-02',
    teamId: 'team_u8',
    mainDorsal: 1,
    secondaryDorsal: 13,
    mainPosition: 'POR',
    secondaryPosition: 'POR',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Manuel Herrera',
      phone: '+34 634 567 890',
      email: 'manuel.herrera@email.com'
    },
    medicalNotes: 'Sin antecedentes médicos.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-02-15', text: 'Muy valiente en los mano a mano. Siempre atento al juego.' }
    ]
  },
  {
    id: 'p_u8_3',
    name: 'Enzo',
    lastName: 'García Castro',
    nickname: 'Capitán',
    birthDate: '2018-03-18',
    teamId: 'team_u8',
    mainDorsal: 4,
    secondaryDorsal: 5,
    mainPosition: 'DFC',
    secondaryPosition: 'MC',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Beatriz Castro',
      phone: '+34 645 678 901',
      email: 'beatriz.castro@email.com'
    },
    medicalNotes: 'Sin alergias conocidas.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-01', text: 'Gran orden táctico en la zaga pese a su corta edad.' }
    ]
  },

  // --- JMK Kindergarten (Naranja) ---
  {
    id: 'p_jmk_1',
    name: 'Martín',
    lastName: 'Soler Ramos',
    nickname: 'Peque',
    birthDate: '2020-06-20',
    teamId: 'team_jmk',
    mainDorsal: 10,
    secondaryDorsal: 11,
    mainPosition: 'DC',
    secondaryPosition: 'MC',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Marta Ramos',
      phone: '+34 656 789 012',
      email: 'marta.ramos@email.com'
    },
    medicalNotes: 'Alergia al huevo (revisar aperitivos en salidas de equipo).',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-03-11', text: 'Se divierte muchísimo, excelente coordinación psicomotriz en ejercicios de habilidad.' }
    ]
  },
  {
    id: 'p_jmk_2',
    name: 'Liam',
    lastName: 'Díaz Roldán',
    nickname: 'Peke-Crack',
    birthDate: '2020-11-05',
    teamId: 'team_jmk',
    mainDorsal: 7,
    secondaryDorsal: 9,
    mainPosition: 'ED',
    secondaryPosition: 'EI',
    foot: 'Zurdo',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Javier Díaz',
      phone: '+34 667 890 123',
      email: 'javier.diaz@email.com'
    },
    medicalNotes: 'Sin incidencias médicas.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-02-25', text: 'Gran manejo de balón con la zurda, muy participativo en juegos grupales.' }
    ]
  },

  // --- U12 Competición (Verde) ---
  {
    id: 'p_u12_1',
    name: 'Marc',
    lastName: 'Beltrán Costa',
    nickname: 'Sniper',
    birthDate: '2014-04-10',
    teamId: 'team_u12',
    mainDorsal: 10,
    secondaryDorsal: 8,
    mainPosition: 'MC',
    secondaryPosition: 'MCO',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Sergi Beltrán',
      phone: '+34 678 901 234',
      email: 'sergi.beltran@email.com'
    },
    medicalNotes: 'Sin antecedentes médicos.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-04', text: 'Especialista a balón parado. Gran golpeo de falta directa.' }
    ]
  },
  {
    id: 'p_u12_2',
    name: 'Darío',
    lastName: 'Alonso Prado',
    nickname: 'Cerrojo',
    birthDate: '2014-08-22',
    teamId: 'team_u12',
    mainDorsal: 5,
    secondaryDorsal: 4,
    mainPosition: 'DFC',
    secondaryPosition: 'MCD',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Gonzalo Alonso',
      phone: '+34 689 012 345',
      email: 'gonzalo.alonso@email.com'
    },
    medicalNotes: 'Sin incidencias médicas.',
    hasMedicalAlert: false,
    coachNotes: [
      { date: '2026-03-10', text: 'Contundente en el cuerpo a cuerpo y excelente salida limpia de balón.' }
    ]
  },

  // --- U14 Competición (Púrpura) ---
  {
    id: 'p_u14_1',
    name: 'Álvaro',
    lastName: 'Vázquez Marín',
    nickname: 'Killer',
    birthDate: '2012-03-15',
    teamId: 'team_u14',
    mainDorsal: 9,
    secondaryDorsal: 19,
    mainPosition: 'DC',
    secondaryPosition: 'EI',
    foot: 'Diestro',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    parentContact: {
      name: 'Patricia Marín',
      phone: '+34 690 123 456',
      email: 'patricia.marin@email.com'
    },
    medicalNotes: 'Esguince de tobillo derecho en 2025, recuperado. Vendaje preventivo recomendado.',
    hasMedicalAlert: true,
    coachNotes: [
      { date: '2026-03-15', text: 'Gran juego de espaldas y desmarque al espacio. 12 goles en 14 jornadas.' }
    ]
  }
];

const STORAGE_KEY_VANS = 'jknoova_vans_v1';

// Flota oficial del club (3 furgonetas Renault Trafic sin etiqueta alquiler) y 3 de alquiler (14, 16 y 19 plazas)
const DEFAULT_VANS = [
  { id: 'van_1', name: 'Renault Trafic 1 (Club)', plate: '4821 - KLP', capacity: 8, model: 'trafic_8', isRental: false },
  { id: 'van_2', name: 'Renault Trafic 2 (Club)', plate: '9304 - MZX', capacity: 8, model: 'trafic_8', isRental: false },
  { id: 'van_3', name: 'Renault Trafic 3 (Club)', plate: '7155 - NBL', capacity: 8, model: 'trafic_8', isRental: false },
  { id: 'van_14', name: 'Furgoneta de alquiler (14 plazas)', plate: '1122 - HJK', capacity: 14, model: 'bus_14', isRental: true },
  { id: 'van_16', name: 'Furgoneta de alquiler (16 plazas)', plate: '3344 - MKP', capacity: 16, model: 'bus_16', isRental: true },
  { id: 'van_19', name: 'Minibús de alquiler (19 plazas)', plate: '5566 - TXR', capacity: 19, model: 'bus_19', isRental: true }
];

// Eventos y partidos predeterminados
const DEFAULT_EVENTS = [
  {
    id: 'ev_101',
    teamId: 'team_u10',
    title: 'Jornada 18: CD La Salle vs JK Noova U10',
    eventType: 'Liga',
    rival: 'CD La Salle',
    isHome: false,
    date: '2026-09-26',
    time: '10:30',
    location: 'Polideportivo Municipal La Salle, Campo 2',
    meetingPoint: 'Sede JK Noova (8:45 AM)',
    notes: 'Salida en furgoneta del club desde la sede.',
    tournamentPrice: 120, // Precio inscripción torneo/liga (€)
    transportPrice: 80,   // Precio transporte (€)
    vanId: 'van_1',       // Furgoneta asignada con matrícula
    // Convocatoria con modo de transporte:
    callUp: [
      { playerId: 'p_u10_1', transport: 'minibus' }, // Mateo Silva
      { playerId: 'p_u10_2', transport: 'minibus' }, // Lucas Gómez
      { playerId: 'p_u10_3', transport: 'minibus' }, // David Martínez
      { playerId: 'p_u10_4', transport: 'minibus' }, // Álex Navarro
      { playerId: 'p_u10_5', transport: 'minibus' }, // Bruno Fernández
      { playerId: 'p_u10_6', transport: 'minibus' }, // Nico Pérez
      { playerId: 'p_u10_7', transport: 'minibus' }, // Samuel Morales
      { playerId: 'p_u10_8', transport: 'car' },     // Iker López
      { playerId: 'p_u10_9', transport: 'car' },     // Hugo Romero
      { playerId: 'p_u10_10', transport: 'minibus' } // Adrián Torres
    ]
  },
  {
    id: 'ev_102',
    teamId: 'team_u8',
    title: 'Torneo Promesas U8 (Fase Final)',
    eventType: 'Torneo',
    rival: '',
    tournamentTeams: 'Atlético Futuro, Cantera Madrid, Rayo Valle, JK Noova',
    tournamentSchedule: '10:00 Fase de grupos\n12:30 Semifinales\n14:00 Gran Final',
    isHome: true,
    date: '2026-10-03',
    time: '11:45',
    location: 'Campo Central JK Noova',
    meetingPoint: 'Vestuarios JK Noova (10:45 AM)',
    notes: 'Torneo con 4 clubes participantes. Cada jugador debe llevar ambas equipaciones.',
    tournamentPrice: 150,
    transportPrice: 0,
    vanId: 'van_2',
    callUp: [
      { playerId: 'p_u8_1', transport: 'minibus' },
      { playerId: 'p_u8_2', transport: 'car' },
      { playerId: 'p_u8_3', transport: 'minibus' }
    ]
  },
  {
    id: 'ev_103',
    teamId: 'team_u12',
    title: 'Amistoso: JK Noova U12 vs Rayo Cantera',
    eventType: 'Amistoso',
    rival: 'Rayo Cantera',
    isHome: false,
    date: '2026-10-10',
    time: '17:00',
    location: 'Ciudad Deportiva Rayo',
    meetingPoint: 'Sede JK Noova (15:15 AM)',
    notes: 'Prueba de sistema 3-3-1.',
    tournamentPrice: 0,
    transportPrice: 60,
    vanId: 'van_1',
    callUp: [
      { playerId: 'p_u12_1', transport: 'minibus' },
      { playerId: 'p_u12_2', transport: 'minibus' }
    ]
  }
];

// Asignación de plazas en la Renault Trafic (8 plazas de pasajeros + Conductor)
const DEFAULT_TRANSPORT_CONFIG = {
  'ev_101': {
    driver: 'Entrenador David',
    front_1: 'p_u10_4', // Álex Navarro
    front_2: 'p_u10_1', // Mateo Silva
    p1: 'p_u10_2',      // Lucas Gómez
    p2: 'p_u10_3',      // David Martínez
    p3: 'p_u10_5',      // Bruno Fernández
    p4: 'p_u10_6',      // Nico Pérez
    p5: 'p_u10_7',      // Samuel Morales
    p6: 'p_u10_10'      // Adrián Torres
  }
};


// Sesiones de entrenamiento predeterminadas
const DEFAULT_TRAININGS = [
  {
    id: 'tr_u10_1',
    date: '2026-09-22',
    time: '17:30 - 19:00',
    title: 'Entrenamiento Táctico y Posesión',
    teamId: 'team_u10',
    location: 'Campo 1 (Césped)',
    coach: 'Entrenador JK Noova',
    notes: 'Rondos de presión y transiciones defensa-ataque.'
  },
  {
    id: 'tr_u12_1',
    date: '2026-09-23',
    time: '19:00 - 20:30',
    title: 'Preparación Física y Estrategia',
    teamId: 'team_u12',
    location: 'Campo 2 (Fútbol 11)',
    coach: 'Preparador Físico',
    notes: 'Circuitos de velocidad y balón parado.'
  },
  {
    id: 'tr_u14_1',
    date: '2026-09-24',
    time: '18:00 - 19:30',
    title: 'Finalizaciones y Juego de Posición',
    teamId: 'team_u14',
    location: 'Campo 1 (Césped)',
    coach: 'Entrenador U14',
    notes: 'Centros laterales y remates.'
  },
  {
    id: 'tr_u8_1',
    date: '2026-09-25',
    time: '17:00 - 18:15',
    title: 'Coordinación y Conducción',
    teamId: 'team_u8',
    location: 'Campo 3 (Fútbol 7)',
    coach: 'Coordinador Base',
    notes: 'Juegos de habilidad motriz y partidillo.'
  }
];

/// Adaptador seguro de almacenamiento con verificación y fallback
const SafeStorage = {
  _mem: {},
  _isWorking: null,
  isWorking() {
    if (this._isWorking !== null) return this._isWorking;
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this._isWorking = false;
        return false;
      }
      const k = '__jk_test_storage__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      this._isWorking = true;
      return true;
    } catch (e) {
      this._isWorking = false;
      return false;
    }
  },
  getItem(key) {
    if (this.isWorking()) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('LocalStorage getItem falló:', e);
      }
    }
    return this._mem[key] || null;
  },
  setItem(key, val) {
    if (this.isWorking()) {
      try {
        window.localStorage.setItem(key, val);
        return;
      } catch (e) {
        console.warn('LocalStorage setItem falló:', e);
      }
    }
    this._mem[key] = String(val);
  },
  removeItem(key) {
    if (this.isWorking()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('LocalStorage removeItem falló:', e);
      }
    }
    delete this._mem[key];
  }
};

// --- CONSTANTES Y TABLAS DE TALLAS OFICIALES ADIDAS Y EQUIPACIÓN ---
const ADIDAS_CLOTHING_SIZES = [
  '4-5Y / 110',
  '5-6Y / 116',
  '7-8Y / 128',
  '9-10Y / 140',
  '11-12Y / 152',
  '13-14Y / 164',
  '15-16Y / 176',
  'XS Adulto',
  'S Adulto',
  'M Adulto',
  'L Adulto',
  'XL Adulto',
  '2XL Adulto'
];

const ADIDAS_SOCKS_SIZES = [
  '23-26',
  '27-30',
  '31-34',
  '35-38',
  '39-42',
  '43-46'
];

const BOOT_SIZES = [
  '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'
];

const SHIN_GUARD_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const BEANIE_SIZES = ['Talla única', 'Junior', 'Senior'];

function createDefaultEquipment() {
  return {
    official: {
      trainingShirt: { owned: false, size: '9-10Y / 140' },
      matchShirt:    { owned: false, size: '9-10Y / 140' },
      shorts:        { owned: false, size: '9-10Y / 140' },
      socks:         { owned: false, size: '31-34' }
    },
    accessories: {
      boots:      { owned: false, size: '36' },
      shinGuards: { owned: false, size: 'S' },
      jerseys:    { owned: false, size: '9-10Y / 140' },
      jacket:     { owned: false, size: '9-10Y / 140' },
      rainJacket: { owned: false, size: '9-10Y / 140' },
      beanie:     { owned: false, size: 'Talla única' }
    },
    notes: ''
  };
}

function checkPlayerOfficialEquipment(player) {
  if (!player) return { complete: false, missing: [] };
  if (!player.equipment || !player.equipment.official) {
    return {
      complete: false,
      missing: ['trainingShirt', 'matchShirt', 'shorts', 'socks'],
      hasAlert: true
    };
  }

  const off = player.equipment.official;
  const missing = [];
  if (!off.trainingShirt || !off.trainingShirt.owned) missing.push('trainingShirt');
  if (!off.matchShirt || !off.matchShirt.owned) missing.push('matchShirt');
  if (!off.shorts || !off.shorts.owned) missing.push('shorts');
  if (!off.socks || !off.socks.owned) missing.push('socks');

  return {
    complete: missing.length === 0,
    missing: missing,
    hasAlert: missing.length > 0
  };
}

/**
 * Servicio de almacenamiento y persistencia
 */
const StorageService = {
  getPlayers() {
    const data = SafeStorage.getItem(STORAGE_KEY_PLAYERS);
    if (data === null || data === undefined) {
      this.savePlayers(DEFAULT_PLAYERS);
      return JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        let needsSave = false;
        parsed.forEach(player => {
          if (!player.equipment || !player.equipment.official) {
            const def = createDefaultEquipment();
            const kd = player.kitDelivery || {};
            const ks = player.kitSizes || {};
            def.official.trainingShirt.owned = !!kd.trainingKit;
            def.official.matchShirt.owned = !!kd.matchKit;
            def.official.shorts.owned = !!kd.matchKit;
            def.official.socks.owned = !!kd.matchKit;
            def.accessories.jerseys.owned = !!kd.tracksuit;
            def.accessories.rainJacket.owned = !!kd.rainjacket;

            if (ks.shirt) {
              def.official.trainingShirt.size = ks.shirt;
              def.official.matchShirt.size = ks.shirt;
            }
            if (ks.shorts) def.official.shorts.size = ks.shorts;
            if (ks.socks) def.official.socks.size = ks.socks;
            if (ks.tracksuit) def.accessories.jerseys.size = ks.tracksuit;
            if (ks.rainjacket) def.accessories.rainJacket.size = ks.rainjacket;

            player.equipment = def;
            needsSave = true;
          }

          if (player.equipment && player.equipment.official && player.equipment.official.socks) {
            const sz = player.equipment.official.socks.size;
            if (sz && sz.includes('(')) {
              player.equipment.official.socks.size = sz.replace(/^[0-9]+K\s*\(([^)]+)\)$/, '$1');
              needsSave = true;
            }
          }
        });

        if (needsSave) {
          this.savePlayers(parsed);
        }

        return parsed;
      }
    } catch (e) {
      console.error('Error al parsear jugadores:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  },

  savePlayers(players) {
    SafeStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        fetch('/api/save-players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players })
        }).catch(() => {});
      } catch (e) {}
    }
  },

  getTeams() {
    const data = SafeStorage.getItem(STORAGE_KEY_TEAMS);
    if (data === null || data === undefined) {
      this.saveTeams(DEFAULT_TEAMS);
      return JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    }
    try {
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {
      console.error('Error al parsear equipos:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_TEAMS));
  },

  saveTeams(teams) {
    SafeStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        fetch('/api/save-teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teams })
        }).catch(() => {});
      } catch (e) {}
    }
  },

  getEvents() {
    const data = SafeStorage.getItem(STORAGE_KEY_EVENTS);
    if (data === null || data === undefined) {
      this.saveEvents(DEFAULT_EVENTS);
      return JSON.parse(JSON.stringify(DEFAULT_EVENTS));
    }
    try {
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {
      console.error('Error al parsear eventos:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_EVENTS));
  },

  saveEvents(events) {
    SafeStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  },

  getTransport() {
    const data = SafeStorage.getItem(STORAGE_KEY_TRANSPORT);
    if (!data) {
      this.saveTransport(DEFAULT_TRANSPORT_CONFIG);
      return DEFAULT_TRANSPORT_CONFIG;
    }
    try {
      const obj = JSON.parse(data);
      if (!obj || typeof obj !== 'object') {
        this.saveTransport(DEFAULT_TRANSPORT_CONFIG);
        return DEFAULT_TRANSPORT_CONFIG;
      }
      return obj;
    } catch (e) {
      console.error('Error al parsear transporte:', e);
      return DEFAULT_TRANSPORT_CONFIG;
    }
  },

  saveTransport(transportConfig) {
    SafeStorage.setItem(STORAGE_KEY_TRANSPORT, JSON.stringify(transportConfig));
  },

  getVans() {
    const data = SafeStorage.getItem(STORAGE_KEY_VANS);
    if (!data) {
      this.saveVans(DEFAULT_VANS);
      return DEFAULT_VANS;
    }
    try {
      let list = JSON.parse(data);
      if (!Array.isArray(list) || list.length === 0) {
        this.saveVans(DEFAULT_VANS);
        return DEFAULT_VANS;
      }

      let modified = false;

      // 1. Asegurar estrictamente que las 3 furgonetas oficiales del club existan
      const requiredClubVans = [
        { id: 'van_1', name: 'Renault Trafic 1 (Club)', plate: '4821 - KLP', capacity: 8, model: 'trafic_8', isRental: false },
        { id: 'van_2', name: 'Renault Trafic 2 (Club)', plate: '9304 - MZX', capacity: 8, model: 'trafic_8', isRental: false },
        { id: 'van_3', name: 'Renault Trafic 3 (Club)', plate: '7155 - NBL', capacity: 8, model: 'trafic_8', isRental: false }
      ];

      requiredClubVans.forEach(rcv => {
        const found = list.find(v => v.id === rcv.id);
        if (!found) {
          list.push({ ...rcv });
          modified = true;
        } else {
          // Normalizar nombre oficial y propiedad
          if (found.name !== rcv.name || found.isRental !== false || found.capacity !== 8) {
            found.name = rcv.name;
            found.isRental = false;
            found.capacity = 8;
            if (!found.plate) found.plate = rcv.plate;
            modified = true;
          }
        }
      });

      // 2. Asegurar los 3 vehículos de alquiler (14, 16 y 19 plazas)
      const requiredRentalVans = [
        { id: 'van_14', name: 'Furgoneta de alquiler (14 plazas)', plate: '1122 - HJK', capacity: 14, model: 'bus_14', isRental: true },
        { id: 'van_16', name: 'Furgoneta de alquiler (16 plazas)', plate: '3344 - MKP', capacity: 16, model: 'bus_16', isRental: true },
        { id: 'van_19', name: 'Minibús de alquiler (19 plazas)', plate: '5566 - TXR', capacity: 19, model: 'bus_19', isRental: true }
      ];

      requiredRentalVans.forEach(rrv => {
        const found = list.find(v => v.id === rrv.id);
        if (!found) {
          list.push({ ...rrv });
          modified = true;
        } else {
          if (found.name !== rrv.name || found.isRental !== true || found.capacity !== rrv.capacity) {
            found.name = rrv.name;
            found.isRental = true;
            found.capacity = rrv.capacity;
            modified = true;
          }
        }
      });

      if (modified) {
        this.saveVans(list);
      }

      return list;
    } catch (e) {
      console.error('Error al parsear furgonetas:', e);
      return DEFAULT_VANS;
    }
  },

  saveVans(vans) {
    SafeStorage.setItem(STORAGE_KEY_VANS, JSON.stringify(vans));
  },

  getAttendance() {
    const data = SafeStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error al parsear asistencia:', e);
      return {};
    }
  },

  saveAttendance(attendance) {
    SafeStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendance));
  },

  getTrainingSessions() {
    const data = SafeStorage.getItem(STORAGE_KEY_TRAININGS);
    if (data === null || data === undefined) {
      this.saveTrainingSessions(DEFAULT_TRAININGS);
      return JSON.parse(JSON.stringify(DEFAULT_TRAININGS));
    }
    try {
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {
      console.error('Error al parsear entrenamientos:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_TRAININGS));
  },

  saveTrainingSessions(sessions) {
    SafeStorage.setItem(STORAGE_KEY_TRAININGS, JSON.stringify(sessions));
  },

  resetAllToDefault() {
    SafeStorage.removeItem(STORAGE_KEY_PLAYERS);
    SafeStorage.removeItem(STORAGE_KEY_TEAMS);
    SafeStorage.removeItem(STORAGE_KEY_EVENTS);
    SafeStorage.removeItem(STORAGE_KEY_TRANSPORT);
    SafeStorage.removeItem(STORAGE_KEY_VANS);
    SafeStorage.removeItem(STORAGE_KEY_ATTENDANCE);
    SafeStorage.removeItem(STORAGE_KEY_TRAININGS);
    this.savePlayers(DEFAULT_PLAYERS);
    this.saveTeams(DEFAULT_TEAMS);
    this.saveEvents(DEFAULT_EVENTS);
    this.saveTransport(DEFAULT_TRANSPORT_CONFIG);
    this.saveVans(DEFAULT_VANS);
    this.saveTrainingSessions(DEFAULT_TRAININGS);
  },

  exportAllData() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      teams: this.getTeams(),
      players: this.getPlayers(),
      events: this.getEvents(),
      transport: this.getTransport(),
      vans: this.getVans(),
      attendance: this.getAttendance(),
      trainings: this.getTrainingSessions()
    }, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.teams && Array.isArray(data.teams)) this.saveTeams(data.teams);
      if (data.players && Array.isArray(data.players)) this.savePlayers(data.players);
      if (data.events && Array.isArray(data.events)) this.saveEvents(data.events);
      if (data.transport && typeof data.transport === 'object') this.saveTransport(data.transport);
      if (data.vans && Array.isArray(data.vans)) this.saveVans(data.vans);
      if (data.attendance && typeof data.attendance === 'object') this.saveAttendance(data.attendance);
      if (data.trainings && Array.isArray(data.trainings)) this.saveTrainingSessions(data.trainings);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// Registro en el entorno global para compatibilidad con carga de archivo local (file://)
if (typeof window !== 'undefined') {
  window.SafeStorage = SafeStorage;
  window.JKNoovaData = {
    DEFAULT_TEAMS,
    DEFAULT_PLAYERS,
    DEFAULT_EVENTS,
    DEFAULT_TRAININGS,
    DEFAULT_TRANSPORT_CONFIG,
    DEFAULT_VANS,
    SafeStorage,
    StorageService,
    ADIDAS_CLOTHING_SIZES,
    ADIDAS_SOCKS_SIZES,
    BOOT_SIZES,
    SHIN_GUARD_SIZES,
    BEANIE_SIZES,
    createDefaultEquipment,
    checkPlayerOfficialEquipment
  };
}

