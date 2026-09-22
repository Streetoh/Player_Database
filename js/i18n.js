/**
 * JK NOOVA - Sistema de Internacionalización Multilingüe (i18n)
 * Soporta Español (ES), English (EN), Eesti keel (ET) y Русский (RU).
 * Traduce elementos estáticos vía data-i18n y textos dinámicos mediante t(key, fallback).
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'jknoova_language';
  const SUPPORTED_LANGS = ['es', 'en', 'et', 'ru', 'uk'];
  const DEFAULT_LANG = 'es';

  const TRANSLATIONS = {
    es: {
      // Navegación y Marca
      'brand.academy': 'Academy',
      'brand.sub': 'Gestión integral de fútbol base',
      'nav.database': 'Base de datos',
      'nav.teams': 'Equipos',
      'nav.calendar': 'Partidos',
      'nav.trainings': 'Entrenamientos',
      'nav.transport': 'Transporte',
      'nav.settings': '⚙️ Config',
      'nav.newPlayer': 'Nuevo jugador',
      'nav.installApp': '📲 Instalar App',

      // Idiomas
      'lang.select': 'Idioma',
      'lang.es': '🇪🇸 Español',
      'lang.en': '🇬🇧 English',
      'lang.et': '🇪🇪 Eesti',
      'lang.ru': '🇷🇺 Русский',
      'lang.uk': '🇺🇦 Українська',

      // Configuración y Copias de Seguridad
      'settings.title': 'Configuración del Sistema',
      'settings.subtitle': 'Gestión de datos del club, copias de seguridad locales y restauración.',
      'settings.exportTitle': 'Exportar copia de seguridad',
      'settings.exportDesc': 'Descarga un archivo JSON con todos los jugadores, equipos y eventos',
      'settings.exportBtn': 'Descargar JSON',
      'settings.importTitle': 'Importar copia de seguridad',
      'settings.importDesc': 'Carga un archivo JSON previo',
      'settings.importBtn': 'Cargar JSON',
      'settings.resetTitle': 'Restablecer demostración',
      'settings.resetDesc': 'Restaura la plantilla inicial de JK Noova',
      'settings.resetBtn': 'Restablecer',
      'settings.close': 'Cerrar',

      // Base de Datos de Jugadores
      'players.title': 'Base de datos de jugadores',
      'players.subtitle': 'Fichas completas, datos de contacto de familiares, tallas Adidas y seguimiento técnico.',
      'players.searchPlaceholder': 'Buscar jugador por nombre, apellido, dorsal...',
      'players.filterTeam': 'Todos los equipos',
      'players.filterPos': 'Todas las posiciones',
      'players.filterEquipment': 'Estado de equipación',
      'players.filterEquipmentAll': 'Toda la equipación',
      'players.filterEquipmentComplete': 'Equipación oficial completa',
      'players.filterEquipmentMissing': 'Falta equipación oficial',
      'players.filterMedical': 'Todas las fichas',
      'players.filterMedicalOnly': 'Solo con alerta médica',
      'players.filterKitOnly': 'Falta equipación',
      'players.filterDorsalOnly': 'Conflicto dorsales',
      'players.sort': 'Ordenar por...',
      'players.sortNameAsc': 'Nombre (A-Z)',
      'players.sortNameDesc': 'Nombre (Z-A)',
      'players.sortAgeAsc': 'Edad (Menor a Mayor)',
      'players.sortAgeDesc': 'Edad (Mayor a Menor)',
      'players.sortStartDesc': 'Primer entreno (Reciente)',
      'players.sortStartAsc': 'Primer entreno (Antiguo)',
      'players.clearFilters': 'Limpiar filtros',
      'players.exportCsv': 'Exportar CSV',
      'players.totalCount': 'Total jugadores',
      'players.teamsCount': 'Equipos activos',
      'players.missingKitCount': 'Falta equipación',
      'players.medicalCount': 'Alertas médicas',
      'players.tabCards': 'Tarjetas',
      'players.tabTable': 'Tabla detallada',
      'players.emptyList': 'No se encontraron jugadores que coincidan con los filtros.',
      'players.firstTraining': 'Primer entreno:',
      'players.age': 'años',
      'players.dorsal': 'Dorsal',
      'players.foot': 'Pie',
      'players.pos': 'Posición',
      'players.tutor': 'Tutor',
      'players.emergency': 'Emergencia',

      // Ficha de Jugador (Modal)
      'playerModal.newTitle': 'Registrar nuevo jugador',
      'playerModal.editTitle': 'Editar ficha de jugador',
      'playerModal.tabSport': '⚽ Datos Deportivos',
      'playerModal.tabFamily': '👨‍👩‍👧 Familia y Tutores',
      'playerModal.tabHealth': '🏥 Salud y Notas',
      'playerModal.tabKit': '👕 Equipación Adidas',
      'playerModal.name': 'Nombre *',
      'playerModal.lastname': 'Apellidos *',
      'playerModal.nickname': 'Nombre en camiseta / Apodo',
      'playerModal.birthdate': 'Fecha de nacimiento *',
      'playerModal.firstTrainingDate': 'Fecha primer entrenamiento (Inicio)',
      'playerModal.team': 'Equipo asignado *',
      'playerModal.mainDorsal': 'Dorsal principal *',
      'playerModal.secDorsal': 'Dorsal secundario / alternativo',
      'playerModal.dominantFoot': 'Pie dominante',
      'playerModal.mainPos': 'Posición principal',
      'playerModal.secPos': 'Posición secundaria',
      'playerModal.changePhoto': 'Cambiar foto',
      'playerModal.adjustPhoto': 'Ajustar foto',
      'playerModal.removePhoto': 'Eliminar foto',
      'playerModal.medicalAlertLabel': 'Marcar como jugador con alerta médica / alergias',
      'playerModal.medicalNotesLabel': 'Detalles de la alerta médica o cuidados requeridos:',
      'playerModal.coachNotesTitle': 'Notas técnicas y seguimiento del entrenador:',
      'playerModal.newCoachNotePlaceholder': 'Escribe una nueva nota técnica...',
      'playerModal.addNoteBtn': 'Añadir nota',
      'playerModal.cancel': 'Cancelar',
      'playerModal.save': 'Guardar ficha',

      // Equipación Adidas & Posesión
      'kit.title': 'Equipación y Material Deportivo (Adidas)',
      'kit.subtitle': 'La equipación oficial es adquirida por las familias. Se controla la posesión de cada prenda y las tallas oficiales Adidas.',
      'kit.officialBlockTitle': '🛡️ Equipación Oficial Obligatoria (Adquirida por los padres)',
      'kit.officialBlockDesc': 'Todo jugador debe poseer estas 4 prendas oficiales para competir y entrenar.',
      'kit.accessoriesBlockTitle': '🎒 Accesorios y Ropa Complementaria',
      'kit.owned': 'Posee',
      'kit.notOwned': 'No posee',
      'kit.trainingShirt': 'Camiseta azul clara (entrenamientos)',
      'kit.matchShirt': 'Camiseta azul oscuro (competición)',
      'kit.shorts': 'Pantalón negro corto',
      'kit.socks': 'Medias negras',
      'kit.boots': 'Botas de fútbol',
      'kit.shinGuards': 'Espinilleras',
      'kit.jerseys': 'Jerseys / Sudadera',
      'kit.jacket': 'Chaqueta de abrigo',
      'kit.rainJacket': 'Chubasquero de lluvia',
      'kit.beanie': 'Gorro deportivo',
      'kit.notes': 'Observaciones de equipación (ej. pendiente de compra por los padres...)',
      'kit.alertMissingOfficial': '⚠️ Falta equipamiento oficial obligatorio: Las familias deben adquirir las prendas faltantes para las competiciones oficiales.',
      'kit.statusComplete': '✅ Equipación oficial completa (Posee las 4 prendas oficiales requeridas).',
      'kit.badgeMissing': '⚠️ Falta equipación',
      'kit.badgeComplete': '🛡️ Equipación oficial',

      // Aviso de Conflicto de Dorsales
      'dorsal.conflictWarning': '⚠️ Conflicto de dorsales en el equipo',
      'dorsal.conflictDetail': 'Dos o más jugadores coinciden con el dorsal #{dorsal} ({players}). Reasigna un dorsal para evitar infracciones en acta.',
      'dorsal.modalWarning': '⚠️ Aviso: El dorsal #{dorsal} ya está asignado a {player} en este equipo.',

      // Familiares
      'family.title': 'Contactos Familiares y Tutores',
      'family.subtitle': 'Añade uno o varios familiares o tutores de contacto.',
      'family.addBtn': '➕ Añadir familiar',
      'family.relation': 'Parentesco',
      'family.relationMother': 'Madre',
      'family.relationFather': 'Padre',
      'family.relationTutor': 'Tutor legal',
      'family.relationGrandparent': 'Abuelo/a',
      'family.relationOther': 'Otro',
      'family.name': 'Nombre y apellidos',
      'family.phone': 'Teléfono móvil',
      'family.email': 'Correo electrónico',
      'family.isEmergency': 'Contacto principal / Emergencia',
      'family.remove': 'Eliminar',

      // Equipos
      'teams.title': 'Equipos y Plantillas',
      'teams.subtitle': 'Organización táctica, asignación de jugadores, paso de lista y control de dorsales por categoría.',
      'teams.allCategories': 'Todas las categorías',
      'teams.newTeamBtn': 'Nuevo equipo',
      'teams.emptyColumn': 'Arrastra jugadores aquí para asignarlos a este equipo',
      'teams.viewRoster': '👁️ Ver plantilla',
      'teams.attendanceBtn': '📋 Lista',
      'teams.unassignedTitle': 'Jugadores sin asignar',
      'teams.unassignedDesc': 'Arrastra a una columna para asignar equipo',
      'teams.modalViewTitle': 'Plantilla del equipo',
      'teams.modalEditTitle': 'Configurar equipo',
      'teams.name': 'Nombre del equipo *',
      'teams.category': 'Categoría *',
      'teams.coach': 'Entrenador principal',
      'teams.color': 'Color identificativo',
      'teams.deleteTeam': 'Eliminar equipo',

      // Calendario y Convocatorias
      'calendar.title': 'Calendario y Convocatorias',
      'calendar.subtitle': 'Partidos oficiales, entrenamientos, torneos, recaudación de cuotas y pizarra táctica.',
      'calendar.newEventBtn': 'Nuevo evento',
      'calendar.allTypes': 'Todos los eventos',
      'calendar.matchesOnly': 'Partidos',
      'calendar.trainingsOnly': 'Entrenamientos',
      'calendar.tournamentsOnly': 'Torneos',
      'calendar.callUpBtn': '📋 Convocatoria',
      'calendar.tacticalBtn': '⚽ Pizarra táctica',
      'calendar.attendancePill': 'Pasar lista',
      'calendar.transportBtn': '🚐 Transporte',
      'calendar.whatsappBtn': '📱 WhatsApp',
      'calendar.editEvent': 'Editar evento',
      'calendar.deleteEvent': 'Eliminar',
      'calendar.cashboxTitle': 'Caja y Pagos de Convocatoria',
      'calendar.feePerPlayer': 'Cuota por jugador (€)',
      'calendar.paid': 'Pagado',
      'calendar.pending': 'Pendiente',
      'calendar.cash': 'Efectivo',
      'calendar.bizum': 'Bizum',
      'calendar.transfer': 'Transferencia',
      'calendar.totalCollected': 'Recaudado',
      'calendar.expected': 'Previsto',
      'calendar.callUpModalTitle': 'Convocatoria de Jugadores',
      'calendar.callUpGroupsDesc': 'Selecciona los jugadores convocados desplegando cada grupo de equipo:',
      'calendar.selectAll': 'Seleccionar todos',
      'calendar.deselectAll': 'Deseleccionar todos',
      'calendar.saveCallUp': 'Guardar convocatoria',

      // Pizarra Táctica
      'tactical.title': '⚽ Pizarra Táctica y Alineación',
      'tactical.startersCount': '{starters} / {total} titulares ({bench} suplentes)',
      'tactical.pitchF7': 'Fútbol 7 (7 jug.)',
      'tactical.pitchF8': 'Fútbol 8 (8 jug.)',
      'tactical.pitchF9': 'Fútbol 9 (9 jug.)',
      'tactical.pitchF11': 'Fútbol 11 (11 jug.)',
      'tactical.resetFormation': '↺ Resetear formación',
      'tactical.benchTitle': '🟡 Banquillo de Suplentes',
      'tactical.benchHelp': 'Haz clic o arrastra para mover libremente o sustituir',
      'tactical.freeMoveTip': '💡 Puedes arrastrar a cualquier jugador libremente por el campo o elegir una formación predefinida.',
      'tactical.shareWhatsApp': '📲 Compartir alineación por WhatsApp',
      'tactical.close': 'Cerrar pizarra',

      // Transporte
      'transport.title': 'Gestión de Transporte y Flota',
      'transport.subtitle': 'Distribución de plazas, furgonetas oficiales del club y vehículos de alquiler.',
      'transport.selectEvent': 'Selecciona un partido o evento:',
      'transport.unassignedTitle': 'Jugadores sin asiento',
      'transport.unassignedDesc': 'Arrastra al mapa del vehículo para asignar plaza',
      'transport.officialFleet': '🚐 Flota Oficial del Club (Renault Trafic)',
      'transport.rentalFleet': '🚌 Flota de Alquiler para Competiciones',
      'transport.van1': 'Renault Trafic 1 (Oficial Club)',
      'transport.van2': 'Renault Trafic 2 (Oficial Club)',
      'transport.van3': 'Renault Trafic 3 (Oficial Club)',
      'transport.bus14': 'Minibús Alquiler 14 Plazas',
      'transport.bus16': 'Minibús Alquiler 16 Plazas',
      'transport.bus19': 'Minibús Alquiler 19 Plazas',
      'transport.driver': 'Conductor',
      'transport.seat': 'Asiento',
      'transport.autoUnassignedNotice': 'ℹ️ Al cambiar de vehículo, los jugadores han quedado sin asiento para una nueva asignación limpia.',

      // Asistencia
      'attendance.title': 'Control de Asistencia',
      'attendance.subtitle': 'Registro diario para entrenamientos y partidos.',
      'attendance.date': 'Fecha:',
      'attendance.present': 'Presente',
      'attendance.absent': 'Ausente',
      'attendance.justified': 'Justificado',
      'attendance.injured': 'Lesionado',
      'attendance.markAllPresent': 'Marcar todos presentes',
      'attendance.save': 'Guardar lista',
      'attendance.shareWhatsApp': 'Compartir lista WhatsApp',
      'attendance.rate': 'Asistencia',

      // Posiciones de Fútbol
      'pos.POR': 'Portero',
      'pos.DFC': 'Defensa Central',
      'pos.LD': 'Lateral Derecho',
      'pos.LI': 'Lateral Izquierdo',
      'pos.MC': 'Mediocentro',
      'pos.MCO': 'Mediapunta',
      'pos.ED': 'Extremo Derecho',
      'pos.EI': 'Extremo Izquierdo',
      'pos.DC': 'Delantero Centro',
      'pos.DEF': 'Defensa',
      'pos.MED': 'Centrocampista',
      'pos.DEL': 'Delantero',

      // Pie hábil
      'foot.right': 'Diestro',
      'foot.left': 'Zurdo',
      'foot.both': 'Ambidiestro',
      'foot.diestro': 'Diestro',
      'foot.zurdo': 'Zurdo',
      'foot.ambidiestro': 'Ambidiestro',

      // Edad
      'age.yearSingular': '1 año',
      'age.yearsPlural': '{n} años',
      'age.monthSingular': '1 mes',
      'age.monthsPlural': '{n} meses',
      'common.and': 'y',

      // Conflicto de dorsales
      'dorsal.duplicateBadge': '⚠️ Mismo dorsal',
      'dorsal.conflictWith': 'Mismo dorsal que',

      // Botones superiores y navegación
      'nav.settingsTitle': 'Copias de seguridad y datos',
      'nav.registerPlayer': '➕ Registrar jugador',

      // Placeholders de búsqueda
      'teams.searchPlaceholder': 'Buscar por nombre o dorsal...',
      'calendar.searchPlaceholder': 'Buscar partidos, rivales o sedes...',
      'transport.searchPlaceholder': 'Buscar jugador convocado...',

      // Botones de secciones
      'teams.attendance': '📋 Pasar lista / Asistencia',
      'teams.newTeam': '➕ Nuevo equipo / grupo',
      'teams.viewSquad': '👁️ Ver plantilla',
      'calendar.newMatch': '➕ Programar partido',
      'calendar.modifyCallup': '✏️ Modificar convocatoria',
      'calendar.tacticalBoard': '⚽ Pizarra táctica',
      'calendar.shareFamily': '📲 Compartir con familias (QR)',
      'calendar.assignTransport': '🚐 Asignar plazas en furgoneta',
      'calendar.deleteMatch': '🗑️ Eliminar partido',
      'transport.match': 'Partido:',
      'transport.vehicle': 'Vehículo:',
      'transport.officialFleet': '🚐 Flota oficial',
      'transport.autoAssign': '⚡ Auto-asignar',
      'transport.clearSeats': '🗑️ Vaciar plazas',
      'transport.print': '🖨️ Imprimir',

      // Pizarra táctica
      'tactical.title': '⚽ Pizarra Táctica y Alineación',
      'tactical.drawingTitle': 'Herramientas de Dibujo',
      'tactical.toolMove': '🖐️ Mover',
      'tactical.toolPencil': '✏️ Lápiz',
      'tactical.toolArrow': '➡️ Flecha',
      'tactical.toolEraser': '🧽 Borrador',
      'tactical.toolUndo': '↩️ Deshacer',
      'tactical.toolClear': '🗑️ Limpiar pizarra',
      'tactical.reset': '↺ Resetear',
      'tactical.benchTitle': '🟡 Banquillo de Suplentes',
      'tactical.benchHint': 'Haz clic o arrastra para sustituir',
      'tactical.ballTitle': '⚽ Balón de fútbol',
      'tactical.ballAttached': 'Acoplado a',
      'tactical.ballCenter': '⚽ Centrar balón',
      'tactical.rivalsTitle': '🔴 Rivales / Oponentes',
      'tactical.addRival': '➕ Añadir rival',
      'tactical.clearRivals': '🗑️ Quitar rivales',
      'tactical.saveLineup': 'Guardar alineación',
      'tactical.whatsapp': '📋 Copiar alineación para WhatsApp',
      'tactical.hintDrag': '💡 Puedes arrastrar a cualquier jugador libremente por todo el campo o elegir una formación predefinida.',
      'common.close': 'Cerrar',

      // Notificaciones Toast y Avisos
      'toast.saved': 'Guardado correctamente',
      'toast.playerUpdated': 'Ficha del jugador actualizada',
      'toast.playerCreated': 'Nuevo jugador registrado',
      'toast.playerDeleted': 'Jugador eliminado',
      'toast.teamUpdated': 'Equipo actualizado',
      'toast.eventSaved': 'Evento guardado',
      'toast.attendanceSaved': 'Asistencia guardada',
      'toast.copied': 'Copiado al portapapeles',
      'toast.error': 'Ha ocurrido un error',
      'toast.required': 'Por favor completa los campos requeridos (*)',
      'toast.backupDownloaded': 'Copia de seguridad descargada',
      'toast.dataRestored': 'Datos restaurados correctamente. Recargando...',

      // Portal de Familias (partido.html)
      'family.metaTitle': 'Consulta de Partido | JK Noova Academy',
      'family.loading': 'Cargando partido...',
      'family.officialCategory': 'Categoría oficial',
      'family.kickoff': 'Pitido inicial',
      'family.remainingTime': 'Tiempo restante',
      'family.pitch': 'Instalación deportiva / Campo:',
      'family.fieldDefault': 'Campo de juego',
      'family.getDirections': 'Cómo llegar en Google Maps',
      'family.transportTitle': 'Transporte y Furgonetas',
      'family.officialFleet': 'Flota oficial',
      'family.officialVehicle': 'Vehículo oficial',
      'family.plate': 'Matrícula',
      'family.departureTime': 'Hora de salida de la furgoneta',
      'family.driver': 'Conductor responsable',
      'family.seatsAssigned': 'Asientos asignados en furgoneta:',
      'family.seatsPending': 'Los asientos se asignarán antes de la salida.',
      'family.seatPlaza': 'Plaza {seat}',
      'family.callupTitle': 'Lista de Convocados',
      'family.callupEmpty': 'La lista de convocados para este partido aún no ha sido publicada.',
      'family.callupCount': '{n} convocados',
      'family.calledUp': 'CONVOCADO',
      'family.clubVan': '🚐 Furgoneta del club',
      'family.privateCar': '🚗 Coche particular',
      'family.paid': '🟢 Pagado',
      'family.pending': '⏳ Pendiente',
      'family.matchLiveFinished': '¡En juego / Finalizado!',
      'family.dateTbd': 'Fecha por confirmar',
      'family.atTime': 'a las {time} h',
      'family.footerAcademy': 'JK Noova Academy • Fútbol Base Formativo',
      'family.footerContact': 'Para cualquier duda o incidencia, contacta con tu entrenador o coordinador.',
      'family.emptyTitle': 'No hay encuentros disponibles',
      'family.emptySubtitle': 'Consulta con el cuerpo técnico de JK Noova'
    },

    en: {
      // Navigation & Branding
      'brand.academy': 'Academy',
      'brand.sub': 'Comprehensive youth football management',
      'nav.database': 'Database',
      'nav.teams': 'Teams',
      'nav.calendar': 'Matches',
      'nav.trainings': 'Trainings',
      'nav.transport': 'Transport',
      'nav.settings': '⚙️ Settings',
      'nav.newPlayer': 'New player',
      'nav.installApp': '📲 Install App',

      // Languages
      'lang.select': 'Language',
      'lang.es': '🇪🇸 Español',
      'lang.en': '🇬🇧 English',
      'lang.et': '🇪🇪 Eesti',
      'lang.ru': '🇷🇺 Русский',
      'lang.uk': '🇺🇦 Ukrainian',

      // Settings & Backup
      'settings.title': 'System Settings',
      'settings.subtitle': 'Club data management, local backups and restoration.',
      'settings.exportTitle': 'Export backup',
      'settings.exportDesc': 'Download a JSON file containing all players, teams, and events',
      'settings.exportBtn': 'Download JSON',
      'settings.importTitle': 'Import backup',
      'settings.importDesc': 'Load a previously exported JSON backup file',
      'settings.importBtn': 'Load JSON',
      'settings.resetTitle': 'Reset demo data',
      'settings.resetDesc': 'Restore default JK Noova starter squad and data',
      'settings.resetBtn': 'Reset demo',
      'settings.close': 'Close',

      // Players Database
      'players.title': 'Players Database',
      'players.subtitle': 'Full profiles, guardian contacts, Adidas sizing, and technical progression.',
      'players.searchPlaceholder': 'Search player by name, surname, number...',
      'players.filterTeam': 'All teams',
      'players.filterPos': 'All positions',
      'players.filterEquipment': 'Kit status',
      'players.filterEquipmentAll': 'All equipment',
      'players.filterEquipmentComplete': 'Complete official kit',
      'players.filterEquipmentMissing': 'Missing official kit',
      'players.filterMedical': 'All files',
      'players.filterMedicalOnly': 'Medical alert only',
      'players.filterKitOnly': 'Missing kit',
      'players.filterDorsalOnly': 'Dorsal conflict',
      'players.sort': 'Sort by...',
      'players.sortNameAsc': 'Name (A-Z)',
      'players.sortNameDesc': 'Name (Z-A)',
      'players.sortAgeAsc': 'Age (Youngest first)',
      'players.sortAgeDesc': 'Age (Oldest first)',
      'players.sortStartDesc': 'First training (Newest)',
      'players.sortStartAsc': 'First training (Oldest)',
      'players.clearFilters': 'Clear filters',
      'players.exportCsv': 'Export CSV',
      'players.totalCount': 'Total players',
      'players.teamsCount': 'Active teams',
      'players.missingKitCount': 'Missing kit',
      'players.medicalCount': 'Medical alerts',
      'players.tabCards': 'Cards',
      'players.tabTable': 'Detailed table',
      'players.emptyList': 'No players match the applied filters.',
      'players.firstTraining': 'First training:',
      'players.age': 'yo',
      'players.dorsal': 'Number',
      'players.foot': 'Foot',
      'players.pos': 'Position',
      'players.tutor': 'Guardian',
      'players.emergency': 'Emergency',

      // Player Profile (Modal)
      'playerModal.newTitle': 'Register new player',
      'playerModal.editTitle': 'Edit player profile',
      'playerModal.tabSport': '⚽ Sporting Data',
      'playerModal.tabFamily': '👨‍👩‍👧 Family & Guardians',
      'playerModal.tabHealth': '🏥 Health & Notes',
      'playerModal.tabKit': '👕 Adidas Equipment',
      'playerModal.name': 'First name *',
      'playerModal.lastname': 'Last name *',
      'playerModal.nickname': 'Jersey name / Nickname',
      'playerModal.birthdate': 'Date of birth *',
      'playerModal.firstTrainingDate': 'First training date (Joined)',
      'playerModal.team': 'Assigned team *',
      'playerModal.mainDorsal': 'Main squad number *',
      'playerModal.secDorsal': 'Secondary / Alternate number',
      'playerModal.dominantFoot': 'Dominant foot',
      'playerModal.mainPos': 'Primary position',
      'playerModal.secPos': 'Secondary position',
      'playerModal.changePhoto': 'Change photo',
      'playerModal.adjustPhoto': 'Adjust crop',
      'playerModal.removePhoto': 'Remove photo',
      'playerModal.medicalAlertLabel': 'Flag player with medical alert / allergies',
      'playerModal.medicalNotesLabel': 'Medical alert details or required precautions:',
      'playerModal.coachNotesTitle': 'Coach notes and technical tracking:',
      'playerModal.newCoachNotePlaceholder': 'Write a new technical note...',
      'playerModal.addNoteBtn': 'Add note',
      'playerModal.cancel': 'Cancel',
      'playerModal.save': 'Save profile',

      // Adidas Kit & Ownership
      'kit.title': 'Equipment & Sports Gear (Adidas)',
      'kit.subtitle': 'The official kit is purchased by parents. Ownership and official Adidas sizes are tracked here.',
      'kit.officialBlockTitle': '🛡️ Mandatory Official Kit (Purchased by parents)',
      'kit.officialBlockDesc': 'Every player must own these 4 official items to compete and train.',
      'kit.accessoriesBlockTitle': '🎒 Accessories & Extra Gear',
      'kit.owned': 'Owned',
      'kit.notOwned': 'Not owned',
      'kit.trainingShirt': 'Light blue shirt (training)',
      'kit.matchShirt': 'Dark blue shirt (competition)',
      'kit.shorts': 'Black shorts',
      'kit.socks': 'Black socks',
      'kit.boots': 'Football boots',
      'kit.shinGuards': 'Shin guards',
      'kit.jerseys': 'Jerseys / Sweatshirt',
      'kit.jacket': 'Warm jacket',
      'kit.rainJacket': 'Rain jacket',
      'kit.beanie': 'Sports beanie',
      'kit.notes': 'Kit remarks (e.g., pending order by parents...)',
      'kit.alertMissingOfficial': '⚠️ Missing mandatory official kit: Parents must purchase the missing items for official matches.',
      'kit.statusComplete': '✅ Complete official kit (Owns all 4 mandatory items).',
      'kit.badgeMissing': '⚠️ Missing kit',
      'kit.badgeComplete': '🛡️ Official kit',

      // Number Conflict Warning
      'dorsal.conflictWarning': '⚠️ Squad number conflict in team',
      'dorsal.conflictDetail': 'Two or more players share jersey #{dorsal} ({players}). Reassign numbers to avoid match infractions.',
      'dorsal.modalWarning': '⚠️ Notice: Jersey #{dorsal} is already assigned to {player} in this team.',

      // Family & Guardians
      'family.title': 'Family Contacts & Guardians',
      'family.subtitle': 'Add one or more family members or legal guardians.',
      'family.addBtn': '➕ Add family member',
      'family.relation': 'Relationship',
      'family.relationMother': 'Mother',
      'family.relationFather': 'Father',
      'family.relationTutor': 'Legal guardian',
      'family.relationGrandparent': 'Grandparent',
      'family.relationOther': 'Other',
      'family.name': 'Full name',
      'family.phone': 'Mobile phone',
      'family.email': 'Email address',
      'family.isEmergency': 'Primary / Emergency contact',
      'family.remove': 'Remove',

      // Teams
      'teams.title': 'Teams & Rosters',
      'teams.subtitle': 'Tactical organization, player assignment, attendance check and jersey control by category.',
      'teams.allCategories': 'All categories',
      'teams.newTeamBtn': 'New team',
      'teams.emptyColumn': 'Drag players here to assign them to this team',
      'teams.viewRoster': '👁️ View roster',
      'teams.attendanceBtn': '📋 Attendance',
      'teams.unassignedTitle': 'Unassigned players',
      'teams.unassignedDesc': 'Drag to a column to assign team',
      'teams.modalViewTitle': 'Team Roster',
      'teams.modalEditTitle': 'Configure team',
      'teams.name': 'Team name *',
      'teams.category': 'Category *',
      'teams.coach': 'Head coach',
      'teams.color': 'Team badge color',
      'teams.deleteTeam': 'Delete team',

      // Calendar & Fixtures
      'calendar.title': 'Calendar & Call-ups',
      'calendar.subtitle': 'Official matches, trainings, tournaments, fee tracking and tactical board.',
      'calendar.newEventBtn': 'New event',
      'calendar.allTypes': 'All events',
      'calendar.matchesOnly': 'Matches',
      'calendar.trainingsOnly': 'Trainings',
      'calendar.tournamentsOnly': 'Tournaments',
      'calendar.callUpBtn': '📋 Squad Call-up',
      'calendar.tacticalBtn': '⚽ Tactical board',
      'calendar.attendancePill': 'Take attendance',
      'calendar.transportBtn': '🚐 Transport',
      'calendar.whatsappBtn': '📱 WhatsApp',
      'calendar.editEvent': 'Edit event',
      'calendar.deleteEvent': 'Delete',
      'calendar.cashboxTitle': 'Matchday Cashbox & Payments',
      'calendar.feePerPlayer': 'Fee per player (€)',
      'calendar.paid': 'Paid',
      'calendar.pending': 'Pending',
      'calendar.cash': 'Cash',
      'calendar.bizum': 'Bizum / Card',
      'calendar.transfer': 'Bank Transfer',
      'calendar.totalCollected': 'Collected',
      'calendar.expected': 'Expected',
      'calendar.callUpModalTitle': 'Player Squad Call-up',
      'calendar.callUpGroupsDesc': 'Select summoned players by expanding each team group:',
      'calendar.selectAll': 'Select all',
      'calendar.deselectAll': 'Deselect all',
      'calendar.saveCallUp': 'Save squad',

      // Tactical Board
      'tactical.title': '⚽ Tactical Board & Lineup',
      'tactical.startersCount': '{starters} / {total} starters ({bench} subs)',
      'tactical.pitchF7': 'Football 7 (7 players)',
      'tactical.pitchF8': 'Football 8 (8 players)',
      'tactical.pitchF9': 'Football 9 (9 players)',
      'tactical.pitchF11': 'Football 11 (11 players)',
      'tactical.resetFormation': '↺ Reset formation',
      'tactical.benchTitle': '🟡 Substitutes Bench',
      'tactical.benchHelp': 'Click or drag freely to move or swap players',
      'tactical.freeMoveTip': '💡 You can freely drag players anywhere on the pitch or pick a preset tactical formation.',
      'tactical.shareWhatsApp': '📲 Share lineup via WhatsApp',
      'tactical.close': 'Close board',

      // Transport
      'transport.title': 'Fleet & Transport Management',
      'transport.subtitle': 'Seat distribution, official club vans and rental coaches.',
      'transport.selectEvent': 'Select a match or event:',
      'transport.unassignedTitle': 'Players without a seat',
      'transport.unassignedDesc': 'Drag to the vehicle map to assign a seat',
      'transport.officialFleet': '🚐 Official Club Fleet (Renault Trafic)',
      'transport.rentalFleet': '🚌 Rental Fleet for Competitions',
      'transport.van1': 'Renault Trafic 1 (Official Club)',
      'transport.van2': 'Renault Trafic 2 (Official Club)',
      'transport.van3': 'Renault Trafic 3 (Official Club)',
      'transport.bus14': '14-Seat Rental Minibus',
      'transport.bus16': '16-Seat Rental Minibus',
      'transport.bus19': '19-Seat Rental Minibus',
      'transport.driver': 'Driver',
      'transport.seat': 'Seat',
      'transport.autoUnassignedNotice': 'ℹ️ Switched vehicle: players were unassigned for a clean seating plan.',

      // Attendance
      'attendance.title': 'Attendance Tracking',
      'attendance.subtitle': 'Daily roll call for training sessions and fixtures.',
      'attendance.date': 'Date:',
      'attendance.present': 'Present',
      'attendance.absent': 'Absent',
      'attendance.justified': 'Excused',
      'attendance.injured': 'Injured',
      'attendance.markAllPresent': 'Mark all present',
      'attendance.save': 'Save attendance',
      'attendance.shareWhatsApp': 'Share attendance on WhatsApp',
      'attendance.rate': 'Attendance',

      // Positions
      'pos.POR': 'Goalkeeper',
      'pos.DFC': 'Centre-Back',
      'pos.LD': 'Right-Back',
      'pos.LI': 'Left-Back',
      'pos.MC': 'Central Midfielder',
      'pos.MCO': 'Attacking Midfielder',
      'pos.ED': 'Right Winger',
      'pos.EI': 'Left Winger',
      'pos.DC': 'Striker',
      'pos.DEF': 'Defender',
      'pos.MED': 'Midfielder',
      'pos.DEL': 'Forward',

      // Foot
      'foot.right': 'Right-footed',
      'foot.left': 'Left-footed',
      'foot.both': 'Both-footed',
      'foot.diestro': 'Right-footed',
      'foot.zurdo': 'Left-footed',
      'foot.ambidiestro': 'Both-footed',

      // Age
      'age.yearSingular': '1 year',
      'age.yearsPlural': '{n} years',
      'age.monthSingular': '1 month',
      'age.monthsPlural': '{n} months',
      'common.and': 'and',

      // Squad number conflict
      'dorsal.duplicateBadge': '⚠️ Duplicate squad #',
      'dorsal.conflictWith': 'Same squad number as',

      // Top buttons & navigation
      'nav.settingsTitle': 'Backups and system data',
      'nav.registerPlayer': '➕ Register player',

      // Search placeholders
      'teams.searchPlaceholder': 'Search by name or squad #...',
      'calendar.searchPlaceholder': 'Search matches, rivals or venues...',
      'transport.searchPlaceholder': 'Search called-up player...',

      // Section buttons
      'teams.attendance': '📋 Roll Call / Attendance',
      'teams.newTeam': '➕ New team / group',
      'teams.viewSquad': '👁️ View squad',
      'calendar.newMatch': '➕ Schedule match',
      'calendar.modifyCallup': '✏️ Edit call-up',
      'calendar.tacticalBoard': '⚽ Tactical board',
      'calendar.shareFamily': '📲 Share with families (QR)',
      'calendar.assignTransport': '🚐 Assign van seats',
      'calendar.deleteMatch': '🗑️ Delete match',
      'transport.match': 'Match:',
      'transport.vehicle': 'Vehicle:',
      'transport.officialFleet': '🚐 Official fleet',
      'transport.autoAssign': '⚡ Auto-assign',
      'transport.clearSeats': '🗑️ Clear seats',
      'transport.print': '🖨️ Print',

      // Tactical board
      'tactical.title': '⚽ Tactical Board & Lineup',
      'tactical.drawingTitle': 'Drawing Tools',
      'tactical.toolMove': '🖐️ Move',
      'tactical.toolPencil': '✏️ Pencil',
      'tactical.toolArrow': '➡️ Arrow',
      'tactical.toolEraser': '🧽 Eraser',
      'tactical.toolUndo': '↩️ Undo',
      'tactical.toolClear': '🗑️ Clear board',
      'tactical.reset': '↺ Reset',
      'tactical.benchTitle': '🟡 Substitutes Bench',
      'tactical.benchHint': 'Click or drag to substitute',
      'tactical.ballTitle': '⚽ Soccer ball',
      'tactical.ballAttached': 'Attached to',
      'tactical.ballCenter': '⚽ Center ball',
      'tactical.rivalsTitle': '🔴 Opponents',
      'tactical.addRival': '➕ Add rival',
      'tactical.clearRivals': '🗑️ Clear rivals',
      'tactical.saveLineup': 'Save lineup',
      'tactical.whatsapp': '📋 Copy lineup for WhatsApp',
      'tactical.hintDrag': '💡 Drag any player freely across the pitch or choose a predefined formation.',
      'common.close': 'Close',

      // Toast Alerts
      'toast.saved': 'Successfully saved',
      'toast.playerUpdated': 'Player profile updated',
      'toast.playerCreated': 'New player registered',
      'toast.playerDeleted': 'Player removed',
      'toast.teamUpdated': 'Team updated',
      'toast.eventSaved': 'Event saved',
      'toast.attendanceSaved': 'Attendance saved',
      'toast.copied': 'Copied to clipboard',
      'toast.error': 'An error occurred',
      'toast.required': 'Please fill in required fields (*)',
      'toast.backupDownloaded': 'Backup file downloaded',
      'toast.dataRestored': 'Data successfully restored. Reloading...',

      // Family Portal (partido.html)
      'family.metaTitle': 'Match Details | JK Noova Academy',
      'family.loading': 'Loading match...',
      'family.officialCategory': 'Official Category',
      'family.kickoff': 'Kick-off',
      'family.remainingTime': 'Remaining Time',
      'family.pitch': 'Sports Facility / Pitch:',
      'family.fieldDefault': 'Match Pitch',
      'family.getDirections': 'Get directions on Google Maps',
      'family.transportTitle': 'Transport & Vans',
      'family.officialFleet': 'Official Fleet',
      'family.officialVehicle': 'Official vehicle',
      'family.plate': 'License plate',
      'family.departureTime': 'Van departure time',
      'family.driver': 'Driver in charge',
      'family.seatsAssigned': 'Assigned van seats:',
      'family.seatsPending': 'Seats will be assigned before departure.',
      'family.seatPlaza': 'Seat {seat}',
      'family.callupTitle': 'Squad Call-up',
      'family.callupEmpty': 'The call-up list for this match has not been published yet.',
      'family.callupCount': '{n} called up',
      'family.calledUp': 'CALLED UP',
      'family.clubVan': '🚐 Club van',
      'family.privateCar': '🚗 Private car',
      'family.paid': '🟢 Paid',
      'family.pending': '⏳ Pending',
      'family.matchLiveFinished': 'Match underway / Finished!',
      'family.dateTbd': 'Date to be confirmed',
      'family.atTime': 'at {time}',
      'family.footerAcademy': 'JK Noova Academy • Youth Football Academy',
      'family.footerContact': 'For questions or issues, please contact your coach or coordinator.',
      'family.emptyTitle': 'No matches available',
      'family.emptySubtitle': 'Please contact the JK Noova coaching staff'
    },

    et: {
      // Navigatsioon ja Bränd
      'brand.academy': 'Akadeemia',
      'brand.sub': 'Noorte jalgpalli terviklik juhtimine',
      'nav.database': 'Andmebaas',
      'nav.teams': 'Meeskonnad',
      'nav.calendar': 'Mängud',
      'nav.trainings': 'Treeningud',
      'nav.transport': 'Transport',
      'nav.settings': '⚙️ Seaded',
      'nav.newPlayer': 'Uus mängija',
      'nav.installApp': '📲 Paigalda äpp',

      // Keeled
      'lang.select': 'Keel',
      'lang.es': '🇪🇸 Español',
      'lang.en': '🇬🇧 English',
      'lang.et': '🇪🇪 Eesti',
      'lang.ru': '🇷🇺 Русский',
      'lang.uk': '🇺🇦 Ukraina',

      // Seaded ja Varundus
      'settings.title': 'Süsteemi Seaded',
      'settings.subtitle': 'Klubi andmete haldus, kohalikud varukoopiad ja taastamine.',
      'settings.exportTitle': 'Ekspordi varukoopia',
      'settings.exportDesc': 'Laadi alla JSON-fail kõigi mängijate, meeskondade ja sündmustega',
      'settings.exportBtn': 'Laadi alla JSON',
      'settings.importTitle': 'Impordi varukoopia',
      'settings.importDesc': 'Laadi üles eelnevalt eksporditud JSON-fail',
      'settings.importBtn': 'Laadi JSON',
      'settings.resetTitle': 'Lähtesta demoandmed',
      'settings.resetDesc': 'Taasta JK Noova algsed näidisandmed',
      'settings.resetBtn': 'Lähtesta',
      'settings.close': 'Sulge',

      // Mängijate Andmebaas
      'players.title': 'Mängijate andmebaas',
      'players.subtitle': 'Täielikud profiilid, vanemate kontaktid, Adidase vormisuurused ja areng.',
      'players.searchPlaceholder': 'Otsi nime, perekonnanime või numbri järgi...',
      'players.filterTeam': 'Kõik meeskonnad',
      'players.filterPos': 'Kõik positsioonid',
      'players.filterEquipment': 'Vormi staatus',
      'players.filterEquipmentAll': 'Kogu varustus',
      'players.filterEquipmentComplete': 'Ametlik vorm olemas',
      'players.filterEquipmentMissing': 'Ametlik vorm puudub',
      'players.filterMedical': 'Kõik profiilid',
      'players.filterMedicalOnly': 'Meditsiinilise hoiatusega',
      'players.filterKitOnly': 'Varustus puudub',
      'players.filterDorsalOnly': 'Numbrite konflikt',
      'players.sort': 'Sorteeri...',
      'players.sortNameAsc': 'Nimi (A-Z)',
      'players.sortNameDesc': 'Nimi (Z-A)',
      'players.sortAgeAsc': 'Vanus (Nooremad ees)',
      'players.sortAgeDesc': 'Vanus (Vanemad ees)',
      'players.sortStartDesc': 'Esimene treening (Uuemad)',
      'players.sortStartAsc': 'Esimene treening (Vanemad)',
      'players.clearFilters': 'Tühjenda filtrid',
      'players.exportCsv': 'Ekspordi CSV',
      'players.totalCount': 'Mängijaid kokku',
      'players.teamsCount': 'Aktiivseid meeskondi',
      'players.missingKitCount': 'Vormita mängijad',
      'players.medicalCount': 'Meditsiinilised hoiatused',
      'players.tabCards': 'Kaardid',
      'players.tabTable': 'Detailne tabel',
      'players.emptyList': 'Valitud filtritele vastavaid mängijaid ei leitud.',
      'players.firstTraining': 'Esimene treening:',
      'players.age': 'a.',
      'players.dorsal': 'Number',
      'players.foot': 'Jalg',
      'players.pos': 'Positsioon',
      'players.tutor': 'Hooldaja',
      'players.emergency': 'Hädaabi',

      // Mängija Profiil (Modaal)
      'playerModal.newTitle': 'Registreeri uus mängija',
      'playerModal.editTitle': 'Muuda mängija profiili',
      'playerModal.tabSport': '⚽ Spordiandmed',
      'playerModal.tabFamily': '👨‍👩‍👧 Pere ja Hooldajad',
      'playerModal.tabHealth': '🏥 Tervis ja Märkmed',
      'playerModal.tabKit': '👕 Adidase Vorm',
      'playerModal.name': 'Eesnimi *',
      'playerModal.lastname': 'Perekonnanimi *',
      'playerModal.nickname': 'Nimi särgil / Hüüdnimi',
      'playerModal.birthdate': 'Sünnikuupäev *',
      'playerModal.firstTrainingDate': 'Esimese treeningu kuupäev (Liitumine)',
      'playerModal.team': 'Määratud meeskond *',
      'playerModal.mainDorsal': 'Põhinumber *',
      'playerModal.secDorsal': 'Teine / Alternatiivne number',
      'playerModal.dominantFoot': 'Tugevam jalg',
      'playerModal.mainPos': 'Põhipositsioon',
      'playerModal.secPos': 'Lisapositsioon',
      'playerModal.changePhoto': 'Muuda fotot',
      'playerModal.adjustPhoto': 'Kärbi / Kohanda',
      'playerModal.removePhoto': 'Eemalda foto',
      'playerModal.medicalAlertLabel': 'Märgi meditsiinilise hoiatusega / allergiatega',
      'playerModal.medicalNotesLabel': 'Meditsiinilised märkmed ja vajalikud ettevaatusabinõud:',
      'playerModal.coachNotesTitle': 'Treeneri märkmed ja arengulugu:',
      'playerModal.newCoachNotePlaceholder': 'Kirjuta uus treeneri märge...',
      'playerModal.addNoteBtn': 'Lisa märge',
      'playerModal.cancel': 'Tühista',
      'playerModal.save': 'Salvesta profiil',

      // Adidase Vorm ja Omamine
      'kit.title': 'Varustus ja Spordivorm (Adidas)',
      'kit.subtitle': 'Ametliku vormi ostavad lapsevanemad. Siin kontrollitakse iga eseme olemasolu ja ametlikke Adidase suurusi.',
      'kit.officialBlockTitle': '🛡️ Kohustuslik Ametlik Vorm (Vanemate poolt ostetav)',
      'kit.officialBlockDesc': 'Igal mängijal peab võistlemiseks ja treenimiseks olema need 4 ametlikku eset.',
      'kit.accessoriesBlockTitle': '🎒 Lisavarustus ja Muu Riietus',
      'kit.owned': 'Olemas',
      'kit.notOwned': 'Puudub',
      'kit.trainingShirt': 'Helesinine särk (treeningud)',
      'kit.matchShirt': 'Tumesinine särk (võistlused)',
      'kit.shorts': 'Mustad lühikesed püksid',
      'kit.socks': 'Mustad põlvikud',
      'kit.boots': 'Jalgpallijalatsid (butsad)',
      'kit.shinGuards': 'Säärekaitsed',
      'kit.jerseys': 'Džemprid / Pusa',
      'kit.jacket': 'Soe jope',
      'kit.rainJacket': 'Vihmajope',
      'kit.beanie': 'Spordimüts',
      'kit.notes': 'Varustuse märkused (nt vanemad tellivad lähiajal...)',
      'kit.alertMissingOfficial': '⚠️ Kohustuslik ametlik vorm puudub: Vanemad peavad ametlikeks mängudeks puuduvad esemed soetama.',
      'kit.statusComplete': '✅ Täielik ametlik vorm olemas (Kõik 4 kohustuslikku eset olemas).',
      'kit.badgeMissing': '⚠️ Vorm puudub',
      'kit.badgeComplete': '🛡️ Ametlik vorm',

      // Numbrite Konflikti Hoiatus
      'dorsal.conflictWarning': '⚠️ Numbrite konflikt meeskonnas',
      'dorsal.conflictDetail': 'Kahel või enamal mängijal on sama number #{dorsal} ({players}). Määra unikaalsed numbrid protokolli reeglite järgimiseks.',
      'dorsal.modalWarning': '⚠️ Hoiatus: Särginumber #{dorsal} on selles meeskonnas juba mängijale {player} määratud.',

      // Pere ja Hooldajad
      'family.title': 'Pere Kontaktid ja Hooldajad',
      'family.subtitle': 'Lisa üks või mitu pereliiget või ametlikku hooldajat.',
      'family.addBtn': '➕ Lisa kontaktisik',
      'family.relation': 'Sugulusaste',
      'family.relationMother': 'Ema',
      'family.relationFather': 'Isa',
      'family.relationTutor': 'Seaduslik hooldaja',
      'family.relationGrandparent': 'Vanaema/Vanaisa',
      'family.relationOther': 'Muu',
      'family.name': 'Ees- ja perekonnanimi',
      'family.phone': 'Mobiiltelefon',
      'family.email': 'E-posti aadress',
      'family.isEmergency': 'Põhikontakt / Hädaabi',
      'family.remove': 'Kustuta',

      // Meeskonnad
      'teams.title': 'Meeskonnad ja Koosseisud',
      'teams.subtitle': 'Taktikaline paigutus, mängijate määramine, kohaloleku kontroll ja numbrid.',
      'teams.allCategories': 'Kõik vanuseklassid',
      'teams.newTeamBtn': 'Uus meeskond',
      'teams.emptyColumn': 'Lohista mängijad siia meeskonda määramiseks',
      'teams.viewRoster': '👁️ Vaata koosseisu',
      'teams.attendanceBtn': '📋 Kohalolek',
      'teams.unassignedTitle': 'Määramata mängijad',
      'teams.unassignedDesc': 'Lohista veergu meeskonda määramiseks',
      'teams.modalViewTitle': 'Meeskonna Koosseis',
      'teams.modalEditTitle': 'Seadista meeskonda',
      'teams.name': 'Meeskonna nimi *',
      'teams.category': 'Vanuseklass *',
      'teams.coach': 'Peatreener',
      'teams.color': 'Meeskonna tunnusvärv',
      'teams.deleteTeam': 'Kustuta meeskond',

      // Kalender ja Koosseisud
      'calendar.title': 'Kalender ja Kutsumised',
      'calendar.subtitle': 'Ametlikud mängud, treeningud, turniirid, tasude arvestus ja taktikatahvel.',
      'calendar.newEventBtn': 'Uus sündmus',
      'calendar.allTypes': 'Kõik sündmused',
      'calendar.matchesOnly': 'Mängud',
      'calendar.trainingsOnly': 'Treeningud',
      'calendar.tournamentsOnly': 'Turniirid',
      'calendar.callUpBtn': '📋 Mängule kutsumine',
      'calendar.tacticalBtn': '⚽ Taktikatahvel',
      'calendar.attendancePill': 'Märgi kohalolek',
      'calendar.transportBtn': '🚐 Transport',
      'calendar.whatsappBtn': '📱 WhatsApp',
      'calendar.editEvent': 'Muuda sündmust',
      'calendar.deleteEvent': 'Kustuta',
      'calendar.cashboxTitle': 'Kassa ja Osalustasud',
      'calendar.feePerPlayer': 'Tasu mängija kohta (€)',
      'calendar.paid': 'Makstud',
      'calendar.pending': 'Ootel',
      'calendar.cash': 'Sularaha',
      'calendar.bizum': 'Kaardimakse / Bizum',
      'calendar.transfer': 'Pangaülekanne',
      'calendar.totalCollected': 'Kogutud',
      'calendar.expected': 'Eeldatav',
      'calendar.callUpModalTitle': 'Mängijate Kutsumine Mängule',
      'calendar.callUpGroupsDesc': 'Vali kutsutud mängijad meeskonnagruppe avades:',
      'calendar.selectAll': 'Vali kõik',
      'calendar.deselectAll': 'Tühista kõik',
      'calendar.saveCallUp': 'Salvesta koosseis',

      // Taktikatahvel
      'tactical.title': '⚽ Taktikatahvel ja Algkoosseis',
      'tactical.startersCount': '{starters} / {total} põhikoosseisus ({bench} varus)',
      'tactical.pitchF7': 'Jalgpall 7 (7 mängijat)',
      'tactical.pitchF8': 'Jalgpall 8 (8 mängijat)',
      'tactical.pitchF9': 'Jalgpall 9 (9 mängijat)',
      'tactical.pitchF11': 'Jalgpall 11 (11 mängijat)',
      'tactical.resetFormation': '↺ Lähtesta formatsioon',
      'tactical.benchTitle': '🟡 Varumängijate Pink',
      'tactical.benchHelp': 'Klõpsa või lohista vabalt platsil või vahetamiseks',
      'tactical.freeMoveTip': '💡 Võid mängijaid vabalt väljakul ükskõik kuhu lohistada või valida valmis formatsiooni.',
      'tactical.shareWhatsApp': '📲 Jaga koosseisu WhatsAppis',
      'tactical.close': 'Sulge tahvel',

      // Transport
      'transport.title': 'Transpordi ja Pargi Haldus',
      'transport.subtitle': 'Kohtade jaotus, klubi ametlikud väikebussid ja renditransport.',
      'transport.selectEvent': 'Vali mäng või sündmus:',
      'transport.unassignedTitle': 'Mängijad ilma istekohata',
      'transport.unassignedDesc': 'Lohista sõiduki kaardile koha määramiseks',
      'transport.officialFleet': '🚐 Klubi Ametlik Pargi (Renault Trafic)',
      'transport.rentalFleet': '🚌 Rendibussid Võistlusteks',
      'transport.van1': 'Renault Trafic 1 (Klubi ametlik)',
      'transport.van2': 'Renault Trafic 2 (Klubi ametlik)',
      'transport.van3': 'Renault Trafic 3 (Klubi ametlik)',
      'transport.bus14': '14-kohaline rendibuss',
      'transport.bus16': '16-kohaline rendibuss',
      'transport.bus19': '19-kohaline rendibuss',
      'transport.driver': 'Juht',
      'transport.seat': 'Koht',
      'transport.autoUnassignedNotice': 'ℹ️ Sõidukit vahetati: mängijad vabastati kohtadelt puhta uue jaotuse jaoks.',

      // Kohalolek
      'attendance.title': 'Kohaloleku Kontroll',
      'attendance.subtitle': 'Igapäevane nimekiri treeninguteks ja mängudeks.',
      'attendance.date': 'Kuupäev:',
      'attendance.present': 'Kohal',
      'attendance.absent': 'Puudub',
      'attendance.justified': 'Põhjendatud',
      'attendance.injured': 'Vigastatud',
      'attendance.markAllPresent': 'Märgi kõik kohale',
      'attendance.save': 'Salvesta kohalolek',
      'attendance.shareWhatsApp': 'Jaga nimekirja WhatsAppis',
      'attendance.rate': 'Osalusprotsent',

      // Positsioonid
      'pos.POR': 'Väravavaht',
      'pos.DFC': 'Keskkaitsja',
      'pos.LD': 'Paremkaitse',
      'pos.LI': 'Vasakkaitse',
      'pos.MC': 'Keskpoolkaitsja',
      'pos.MCO': 'Ründav poolkaitsja',
      'pos.ED': 'Paremääre',
      'pos.EI': 'Vasakääre',
      'pos.DC': 'Keskründaja',
      'pos.DEF': 'Kaitsja',
      'pos.MED': 'Poolkaitsja',
      'pos.DEL': 'Ründaja',

      // Jalg
      'foot.right': 'Parem jalg',
      'foot.left': 'Vasak jalg',
      'foot.both': 'Mõlemad jalad',
      'foot.diestro': 'Paremakäeline',
      'foot.zurdo': 'Vasakukäeline',
      'foot.ambidiestro': 'Mõlemajalgsus',

      // Vanus
      'age.yearSingular': '1 aasta',
      'age.yearsPlural': '{n} a.',
      'age.monthSingular': '1 kuu',
      'age.monthsPlural': '{n} kuud',
      'common.and': 'ja',

      // Särginumbri konflikt
      'dorsal.duplicateBadge': '⚠️ Sama number',
      'dorsal.conflictWith': 'Sama number mängijaga',

      // Päise nupud ja navigatsioon
      'nav.settingsTitle': 'Varukoopiad ja süsteemi andmed',
      'nav.registerPlayer': '➕ Registreeri mängija',

      // Otsingu kohatäitjad
      'teams.searchPlaceholder': 'Otsi nime või numbri järgi...',
      'calendar.searchPlaceholder': 'Otsi mänge, vastaseid või asukohti...',
      'transport.searchPlaceholder': 'Otsi kutsutud mängijat...',

      // Sektsioonide nupud
      'teams.attendance': '📋 Kohaloleku kontroll',
      'teams.newTeam': '➕ Uus meeskond / grupp',
      'teams.viewSquad': '👁️ Vaata koosseisu',
      'calendar.newMatch': '➕ Planeeri mäng',
      'calendar.modifyCallup': '✏️ Muuda koosseisu',
      'calendar.tacticalBoard': '⚽ Taktikatahvel',
      'calendar.shareFamily': '📲 Jaga peredega (QR)',
      'calendar.assignTransport': '🚐 Määra kohad väikebussis',
      'calendar.deleteMatch': '🗑️ Kustuta mäng',
      'transport.match': 'Mäng:',
      'transport.vehicle': 'Sõiduk:',
      'transport.officialFleet': '🚐 Ametlik autopark',
      'transport.autoAssign': '⚡ Automaatne määramine',
      'transport.clearSeats': '🗑️ Tühjenda kohad',
      'transport.print': '🖨️ Prindi',

      // Taktikatahvel
      'tactical.title': '⚽ Taktikatahvel ja Koosseis',
      'tactical.drawingTitle': 'Joonistustööriistad',
      'tactical.toolMove': '🖐️ Liiguta',
      'tactical.toolPencil': '✏️ Pliiats',
      'tactical.toolArrow': '➡️ Nool',
      'tactical.toolEraser': '🧽 Kustutuskumm',
      'tactical.toolUndo': '↩️ Võta tagasi',
      'tactical.toolClear': '🗑️ Puhasta tahvel',
      'tactical.reset': '↺ Lähtesta',
      'tactical.benchTitle': '🟡 Varumängijate Pink',
      'tactical.benchHint': 'Klõpsa või lohista vahetuseks',
      'tactical.ballTitle': '⚽ Jalgpall',
      'tactical.ballAttached': 'Kinnitatud',
      'tactical.ballCenter': '⚽ Pall keskele',
      'tactical.rivalsTitle': '🔴 Vastasmängijad',
      'tactical.addRival': '➕ Lisa vastane',
      'tactical.clearRivals': '🗑️ Eemalda vastased',
      'tactical.saveLineup': 'Salvesta koosseis',
      'tactical.whatsapp': '📋 Kopeeri koosseis WhatsAppi jaoks',
      'tactical.hintDrag': '💡 Lohista iga mängijat vabalt üle väljaku või vali eelseadistatud asetus.',
      'common.close': 'Sulge',

      // Teated (Toast)
      'toast.saved': 'Edukatult salvestatud',
      'toast.playerUpdated': 'Mängija profiil uuendatud',
      'toast.playerCreated': 'Uus mängija registreeritud',
      'toast.playerDeleted': 'Mängija kustutatud',
      'toast.teamUpdated': 'Meeskond uuendatud',
      'toast.eventSaved': 'Sündmus salvestatud',
      'toast.attendanceSaved': 'Kohalolek salvestatud',
      'toast.copied': 'Kopeeritud lõikelauale',
      'toast.error': 'Tekkis viga',
      'toast.required': 'Palun täida nõutud väljad (*)',
      'toast.backupDownloaded': 'Varukoopia alla laaditud',
      'toast.dataRestored': 'Andmed edukalt taastatud. Leht laaditakse uuesti...',

      // Perede portaal (partido.html)
      'family.metaTitle': 'Mängu info | JK Noova Academy',
      'family.loading': 'Mängu laadimine...',
      'family.officialCategory': 'Ametlik kategooria',
      'family.kickoff': 'Algusvile',
      'family.remainingTime': 'Järelejäänud aeg',
      'family.pitch': 'Spordirajatis / Väljak:',
      'family.fieldDefault': 'Mänguväljak',
      'family.getDirections': 'Juhised Google Mapsis',
      'family.transportTitle': 'Transport ja väikebussid',
      'family.officialFleet': 'Klubi transport',
      'family.officialVehicle': 'Ametlik sõiduk',
      'family.plate': 'Numbrimärk',
      'family.departureTime': 'Väikebussi väljumisaeg',
      'family.driver': 'Vastutav juht',
      'family.seatsAssigned': 'Määratud kohad väikebussis:',
      'family.seatsPending': 'Istekohad määratakse enne väljasõitu.',
      'family.seatPlaza': 'Koht {seat}',
      'family.callupTitle': 'Koosseis / Kutsutud mängijad',
      'family.callupEmpty': 'Selle mängu koosseisu pole veel avaldatud.',
      'family.callupCount': '{n} kutsutud',
      'family.calledUp': 'KUTSUTUD',
      'family.clubVan': '🚐 Klubi väikebuss',
      'family.privateCar': '🚗 Isiklik auto',
      'family.paid': '🟢 Makstud',
      'family.pending': '⏳ Ootel',
      'family.matchLiveFinished': 'Mäng käib / Lõppenud!',
      'family.dateTbd': 'Kuupäev kinnitamisel',
      'family.atTime': 'kell {time}',
      'family.footerAcademy': 'JK Noova Academy • Noorte jalgpalliakadeemia',
      'family.footerContact': 'Küsimuste korral võtke ühendust treeneri või koordinaatoriga.',
      'family.emptyTitle': 'Mänge pole saadaval',
      'family.emptySubtitle': 'Võtke ühendust JK Noova treeneritega'
    },

    ru: {
      // Навигация и Бренд
      'brand.academy': 'Academy',
      'brand.sub': 'Комплексное управление детско-юношеским футболом',
      'nav.database': 'База данных',
      'nav.teams': 'Команды',
      'nav.calendar': 'Матчи',
      'nav.trainings': 'Тренировки',
      'nav.transport': 'Транспорт',
      'nav.settings': '⚙️ Настройки',
      'nav.newPlayer': 'Новый игрок',
      'nav.installApp': '📲 Установить',

      // Языки
      'lang.select': 'Язык',
      'lang.es': '🇪🇸 Español',
      'lang.en': '🇬🇧 English',
      'lang.et': '🇪🇪 Eesti',
      'lang.ru': '🇷🇺 Русский',
      'lang.uk': '🇺🇦 Украинский',

      // Настройки и Резервные Копии
      'settings.title': 'Настройки Системы',
      'settings.subtitle': 'Управление данными клуба, локальные копии и восстановление.',
      'settings.exportTitle': 'Экспорт резервной копии',
      'settings.exportDesc': 'Скачать файл JSON со всеми игроками, командами и событиями',
      'settings.exportBtn': 'Скачать JSON',
      'settings.importTitle': 'Импорт резервной копии',
      'settings.importDesc': 'Загрузить ранее сохраненный файл JSON',
      'settings.importBtn': 'Загрузить JSON',
      'settings.resetTitle': 'Сбросить к демо-данным',
      'settings.resetDesc': 'Восстановить исходный состав и данные JK Noova',
      'settings.resetBtn': 'Сбросить',
      'settings.close': 'Закрыть',

      // База Данных Игроков
      'players.title': 'База данных игроков',
      'players.subtitle': 'Полные анкеты, контакты родителей, размеры формы Adidas и прогресс.',
      'players.searchPlaceholder': 'Поиск игрока по имени, фамилии, номеру...',
      'players.filterTeam': 'Все команды',
      'players.filterPos': 'Все позиции',
      'players.filterEquipment': 'Статус формы',
      'players.filterEquipmentAll': 'Вся экипировка',
      'players.filterEquipmentComplete': 'Официальная форма есть',
      'players.filterEquipmentMissing': 'Нет официальной формы',
      'players.filterMedical': 'Все анкеты',
      'players.filterMedicalOnly': 'С мед. предупреждением',
      'players.filterKitOnly': 'Нехватка формы',
      'players.filterDorsalOnly': 'Конфликт номеров',
      'players.sort': 'Сортировка...',
      'players.sortNameAsc': 'Имя (А-Я)',
      'players.sortNameDesc': 'Имя (Я-А)',
      'players.sortAgeAsc': 'Возраст (Младшие сначала)',
      'players.sortAgeDesc': 'Возраст (Старшие сначала)',
      'players.sortStartDesc': 'Первая тренировка (Новые)',
      'players.sortStartAsc': 'Первая тренировка (Давние)',
      'players.clearFilters': 'Сбросить фильтры',
      'players.exportCsv': 'Экспорт CSV',
      'players.totalCount': 'Всего игроков',
      'players.teamsCount': 'Активных команд',
      'players.missingKitCount': 'Без формы',
      'players.medicalCount': 'Мед. предупреждения',
      'players.tabCards': 'Карточки',
      'players.tabTable': 'Подробная таблица',
      'players.emptyList': 'Игроки по заданным фильтрам не найдены.',
      'players.firstTraining': 'Первая тренировка:',
      'players.age': 'лет',
      'players.dorsal': 'Номер',
      'players.foot': 'Нога',
      'players.pos': 'Позиция',
      'players.tutor': 'Родитель',
      'players.emergency': 'Экстренный',

      // Профиль Игрока (Модальное Окно)
      'playerModal.newTitle': 'Регистрация нового игрока',
      'playerModal.editTitle': 'Редактировать анкету игрока',
      'playerModal.tabSport': '⚽ Спортивные Данные',
      'playerModal.tabFamily': '👨‍👩‍👧 Семья и Родители',
      'playerModal.tabHealth': '🏥 Здоровье и Заметки',
      'playerModal.tabKit': '👕 Форма Adidas',
      'playerModal.name': 'Имя *',
      'playerModal.lastname': 'Фамилия *',
      'playerModal.nickname': 'Имя на футболке / Прозвище',
      'playerModal.birthdate': 'Дата рождения *',
      'playerModal.firstTrainingDate': 'Дата первой тренировки (Начало)',
      'playerModal.team': 'Команда *',
      'playerModal.mainDorsal': 'Основной номер *',
      'playerModal.secDorsal': 'Запасной номер',
      'playerModal.dominantFoot': 'Рабочая нога',
      'playerModal.mainPos': 'Основная позиция',
      'playerModal.secPos': 'Вторая позиция',
      'playerModal.changePhoto': 'Изменить фото',
      'playerModal.adjustPhoto': 'Кадрировать',
      'playerModal.removePhoto': 'Удалить фото',
      'playerModal.medicalAlertLabel': 'Отметить мед. предупреждение / аллергии',
      'playerModal.medicalNotesLabel': 'Подробности мед. предупреждения или особый уход:',
      'playerModal.coachNotesTitle': 'Заметки тренера и технический прогресс:',
      'playerModal.newCoachNotePlaceholder': 'Написать новую тренерскую заметку...',
      'playerModal.addNoteBtn': 'Добавить заметку',
      'playerModal.cancel': 'Отмена',
      'playerModal.save': 'Сохранить анкету',

      // Форма Adidas и Наличие
      'kit.title': 'Экипировка и Форма (Adidas)',
      'kit.subtitle': 'Официальную форму приобретают родители. Здесь фиксируется наличие каждого предмета и официальные размеры Adidas.',
      'kit.officialBlockTitle': '🛡️ Обязательная Официальная Форма (Покупают родители)',
      'kit.officialBlockDesc': 'У каждого игрока должны быть эти 4 предмета для тренировок и соревнований.',
      'kit.accessoriesBlockTitle': '🎒 Аксессуары и Дополнительная Экипировка',
      'kit.owned': 'В наличии',
      'kit.notOwned': 'Отсутствует',
      'kit.trainingShirt': 'Светло-синяя футболка (тренировочная)',
      'kit.matchShirt': 'Темно-синяя футболка (игровая)',
      'kit.shorts': 'Черные шорты',
      'kit.socks': 'Черные гетры',
      'kit.boots': 'Футбольные бутсы',
      'kit.shinGuards': 'Футбольные щитки',
      'kit.jerseys': 'Джемпер / Толстовка',
      'kit.jacket': 'Теплая куртка',
      'kit.rainJacket': 'Ветровка / Дождевик',
      'kit.beanie': 'Спортивная шапка',
      'kit.notes': 'Заметки по экипировке (напр. родители докупят на днях...)',
      'kit.alertMissingOfficial': '⚠️ Отсутствует обязательная официальная форма: Родителям необходимо приобрести недостающие элементы для участия в матчах.',
      'kit.statusComplete': '✅ Полный комплект официальной формы (Все 4 обязательных предмета в наличии).',
      'kit.badgeMissing': '⚠️ Нет формы',
      'kit.badgeComplete': '🛡️ Форма есть',

      // Конфликт Номеров
      'dorsal.conflictWarning': '⚠️ Конфликт номеров в команде',
      'dorsal.conflictDetail': 'У двух или более игроков совпадает номер #{dorsal} ({players}). Переназначьте номер во избежание нарушений в протоколе.',
      'dorsal.modalWarning': '⚠️ Предупреждение: Номер #{dorsal} уже занят игроком {player} в этой команде.',

      // Семья и Родители
      'family.title': 'Контакты Родителей и Опекунов',
      'family.subtitle': 'Добавьте одного или нескольких родителей/опекунов.',
      'family.addBtn': '➕ Добавить контакт',
      'family.relation': 'Кем приходится',
      'family.relationMother': 'Мама',
      'family.relationFather': 'Папа',
      'family.relationTutor': 'Опекун',
      'family.relationGrandparent': 'Бабушка/Дедушка',
      'family.relationOther': 'Другой',
      'family.name': 'Имя и фамилия',
      'family.phone': 'Мобильный телефон',
      'family.email': 'Электронная почта',
      'family.isEmergency': 'Основной / Экстренный контакт',
      'family.remove': 'Удалить',

      // Команды
      'teams.title': 'Команды и Составы',
      'teams.subtitle': 'Тактическая организация, распределение игроков, учет посещаемости и номеров.',
      'teams.allCategories': 'Все возрастные группы',
      'teams.newTeamBtn': 'Новая команда',
      'teams.emptyColumn': 'Перетащите игроков сюда для назначения в команду',
      'teams.viewRoster': '👁️ Состав',
      'teams.attendanceBtn': '📋 Список',
      'teams.unassignedTitle': 'Нераспределенные игроки',
      'teams.unassignedDesc': 'Перетащите в колонку для добавления в команду',
      'teams.modalViewTitle': 'Состав команды',
      'teams.modalEditTitle': 'Настроить команду',
      'teams.name': 'Название команды *',
      'teams.category': 'Возрастная категория *',
      'teams.coach': 'Главный тренер',
      'teams.color': 'Цвет команды',
      'teams.deleteTeam': 'Удалить команду',

      // Календарь и Заявки
      'calendar.title': 'Календарь и Заявки',
      'calendar.subtitle': 'Официальные матчи, тренировки, турниры, взносы и тактическая доска.',
      'calendar.newEventBtn': 'Новое событие',
      'calendar.allTypes': 'Все события',
      'calendar.matchesOnly': 'Матчи',
      'calendar.trainingsOnly': 'Тренировки',
      'calendar.tournamentsOnly': 'Турниры',
      'calendar.callUpBtn': '📋 Заявка на матч',
      'calendar.tacticalBtn': '⚽ Тактическая доска',
      'calendar.attendancePill': 'Отметить список',
      'calendar.transportBtn': '🚐 Транспорт',
      'calendar.whatsappBtn': '📱 WhatsApp',
      'calendar.editEvent': 'Редактировать событие',
      'calendar.deleteEvent': 'Удалить',
      'calendar.cashboxTitle': 'Касса и Взносы на Игру',
      'calendar.feePerPlayer': 'Взнос за игрока (€)',
      'calendar.paid': 'Оплачено',
      'calendar.pending': 'В ожидании',
      'calendar.cash': 'Наличные',
      'calendar.bizum': 'Карта / Bizum',
      'calendar.transfer': 'Банковский перевод',
      'calendar.totalCollected': 'Собрано',
      'calendar.expected': 'Ожидается',
      'calendar.callUpModalTitle': 'Заявка Игроков на Матч',
      'calendar.callUpGroupsDesc': 'Выберите вызванных игроков, раскрывая списки команд:',
      'calendar.selectAll': 'Выбрать всех',
      'calendar.deselectAll': 'Снять выбор со всех',
      'calendar.saveCallUp': 'Сохранить заявку',

      // Тактическая Доска
      'tactical.title': '⚽ Тактическая Доска и Расстановка',
      'tactical.startersCount': '{starters} / {total} в старте ({bench} запасных)',
      'tactical.pitchF7': 'Футбол 7 (7 игроков)',
      'tactical.pitchF8': 'Футбол 8 (8 игроков)',
      'tactical.pitchF9': 'Футбол 9 (9 игроков)',
      'tactical.pitchF11': 'Футбол 11 (11 игроков)',
      'tactical.resetFormation': '↺ Сбросить расстановку',
      'tactical.benchTitle': '🟡 Скамья Запасных',
      'tactical.benchHelp': 'Нажмите или свободно перетаскивайте по полю для замены',
      'tactical.freeMoveTip': '💡 Вы можете свободно перетаскивать игроков в любую точку поля или выбрать стандартную схему.',
      'tactical.shareWhatsApp': '📲 Отправить расстановку в WhatsApp',
      'tactical.close': 'Закрыть доску',

      // Транспорт
      'transport.title': 'Управление Транспортом и Автопарком',
      'transport.subtitle': 'Распределение мест, официальные клубные микроавтобусы и аренда.',
      'transport.selectEvent': 'Выберите матч или выезд:',
      'transport.unassignedTitle': 'Игроки без места',
      'transport.unassignedDesc': 'Перетащите на схему транспорта для назначения места',
      'transport.officialFleet': '🚐 Официальный Автопарк Клуба (Renault Trafic)',
      'transport.rentalFleet': '🚌 Арендный Транспорт для Выездов',
      'transport.van1': 'Renault Trafic 1 (Клубный)',
      'transport.van2': 'Renault Trafic 2 (Клубный)',
      'transport.van3': 'Renault Trafic 3 (Клубный)',
      'transport.bus14': 'Арендный автобус 14 мест',
      'transport.bus16': 'Арендный автобус 16 мест',
      'transport.bus19': 'Арендный автобус 19 мест',
      'transport.driver': 'Водитель',
      'transport.seat': 'Место',
      'transport.autoUnassignedNotice': 'ℹ️ Транспорт изменен: игроки сняты с мест для чистого переназначения.',

      // Посещаемость
      'attendance.title': 'Учет Посещаемости',
      'attendance.subtitle': 'Ежедневная перекличка на тренировках и матчах.',
      'attendance.date': 'Дата:',
      'attendance.present': 'Присутствует',
      'attendance.absent': 'Отсутствует',
      'attendance.justified': 'Уважительная',
      'attendance.injured': 'Травмирован',
      'attendance.markAllPresent': 'Отметить всех присутствующими',
      'attendance.save': 'Сохранить список',
      'attendance.shareWhatsApp': 'Поделиться списком в WhatsApp',
      'attendance.rate': 'Посещаемость',

      // Позиции
      'pos.POR': 'Вратарь',
      'pos.DFC': 'Центральный защитник',
      'pos.LD': 'Правый защитник',
      'pos.LI': 'Левый защитник',
      'pos.MC': 'Центральный полузащитник',
      'pos.MCO': 'Атакующий полузащитник',
      'pos.ED': 'Правый вингер',
      'pos.EI': 'Левый вингер',
      'pos.DC': 'Центральный нападающий',
      'pos.DEF': 'Защитник',
      'pos.MED': 'Полузащитник',
      'pos.DEL': 'Нападающий',

      // Нога
      'foot.right': 'Правша',
      'foot.left': 'Левша',
      'foot.both': 'Обе ноги',
      'foot.diestro': 'Правша',
      'foot.zurdo': 'Левша',
      'foot.ambidiestro': 'Амбидекстр',

      // Возраст
      'age.yearSingular': '1 год',
      'age.yearsPlural': '{n} лет',
      'age.monthSingular': '1 месяц',
      'age.monthsPlural': '{n} мес.',
      'common.and': 'и',

      // Конфликт номеров
      'dorsal.duplicateBadge': '⚠️ Одинаковый номер',
      'dorsal.conflictWith': 'Тот же номер, что и у',

      // Верхние кнопки и навигация
      'nav.settingsTitle': 'Резервные копии и данные',
      'nav.registerPlayer': '➕ Добавить игрока',

      // Поисковые подсказки
      'teams.searchPlaceholder': 'Поиск по имени или номеру...',
      'calendar.searchPlaceholder': 'Поиск матчей, соперников или стадионов...',
      'transport.searchPlaceholder': 'Поиск заявленного игрока...',

      // Кнопки разделов
      'teams.attendance': '📋 Перекличка / Посещаемость',
      'teams.newTeam': '➕ Новая команда / группа',
      'teams.viewSquad': '👁️ Состав команды',
      'calendar.newMatch': '➕ Запланировать матч',
      'calendar.modifyCallup': '✏️ Изменить заявку',
      'calendar.tacticalBoard': '⚽ Тактическая доска',
      'calendar.shareFamily': '📲 Поделиться с родителями (QR)',
      'calendar.assignTransport': '🚐 Места в микроавтобусе',
      'calendar.deleteMatch': '🗑️ Удалить матч',
      'transport.match': 'Матч:',
      'transport.vehicle': 'Автомобиль:',
      'transport.officialFleet': '🚐 Официальный автопарк',
      'transport.autoAssign': '⚡ Авто-назначение',
      'transport.clearSeats': '🗑️ Очистить места',
      'transport.print': '🖨️ Печать',

      // Тактическая доска
      'tactical.title': '⚽ Тактическая Доска и Расстановка',
      'tactical.drawingTitle': 'Инструменты рисования',
      'tactical.toolMove': '🖐️ Перемещение',
      'tactical.toolPencil': '✏️ Карандаш',
      'tactical.toolArrow': '➡️ Стрелка',
      'tactical.toolEraser': '🧽 Ластик',
      'tactical.toolUndo': '↩️ Отменить',
      'tactical.toolClear': '🗑️ Очистить доску',
      'tactical.reset': '↺ Сброс',
      'tactical.benchTitle': '🟡 Скамья Запасных',
      'tactical.benchHint': 'Нажмите или перетащите для замены',
      'tactical.ballTitle': '⚽ Футбольный мяч',
      'tactical.ballAttached': 'Закреплен за',
      'tactical.ballCenter': '⚽ Мяч в центр',
      'tactical.rivalsTitle': '🔴 Соперники',
      'tactical.addRival': '➕ Добавить соперника',
      'tactical.clearRivals': '🗑️ Убрать соперников',
      'tactical.saveLineup': 'Сохранить расстановку',
      'tactical.whatsapp': '📋 Скопировать расстановку для WhatsApp',
      'tactical.hintDrag': '💡 Перетаскивайте любого игрока по полю или выберите готовую схему.',
      'common.close': 'Закрыть',

      // Уведомления (Toast)
      'toast.saved': 'Успешно сохранено',
      'toast.playerUpdated': 'Анкета игрока обновлена',
      'toast.playerCreated': 'Новый игрок зарегистрирован',
      'toast.playerDeleted': 'Игрок удален',
      'toast.teamUpdated': 'Команда обновлена',
      'toast.eventSaved': 'Событие сохранено',
      'toast.attendanceSaved': 'Посещаемость сохранена',
      'toast.copied': 'Скопировано в буфер обмена',
      'toast.error': 'Произошла ошибка',
      'toast.required': 'Пожалуйста, заполните обязательные поля (*)',
      'toast.backupDownloaded': 'Резервная копия скачана',
      'toast.dataRestored': 'Данные успешно восстановлены. Перезагрузка...',

      // Портал для родителей (partido.html)
      'family.metaTitle': 'Информация о матче | JK Noova Academy',
      'family.loading': 'Загрузка матча...',
      'family.officialCategory': 'Официальная категория',
      'family.kickoff': 'Свисток к началу',
      'family.remainingTime': 'До матча осталось',
      'family.pitch': 'Спортивный комплекс / Поле:',
      'family.fieldDefault': 'Игровое поле',
      'family.getDirections': 'Маршрут в Google Maps',
      'family.transportTitle': 'Транспорт и микроавтобусы',
      'family.officialFleet': 'Клубный транспорт',
      'family.officialVehicle': 'Официальный автомобиль',
      'family.plate': 'Номерной знак',
      'family.departureTime': 'Время отправления микроавтобуса',
      'family.driver': 'Ответственный водитель',
      'family.seatsAssigned': 'Назначенные места в микроавтобусе:',
      'family.seatsPending': 'Места будут распределены перед выездом.',
      'family.seatPlaza': 'Место {seat}',
      'family.callupTitle': 'Список вызванных игроков',
      'family.callupEmpty': 'Список игроков на этот матч еще не опубликован.',
      'family.callupCount': '{n} вызвано',
      'family.calledUp': 'В СОСТАВЕ',
      'family.clubVan': '🚐 Микроавтобус клуба',
      'family.privateCar': '🚗 Личный автомобиль',
      'family.paid': '🟢 Оплачено',
      'family.pending': '⏳ Ожидается',
      'family.matchLiveFinished': 'Идет матч / Завершен!',
      'family.dateTbd': 'Дата уточняется',
      'family.atTime': 'в {time}',
      'family.footerAcademy': 'JK Noova Academy • Детско-юношеский футбол',
      'family.footerContact': 'По всем вопросам обращайтесь к тренеру или координатору.',
      'family.emptyTitle': 'Нет доступных матчей',
      'family.emptySubtitle': 'Обратитесь к тренерскому штабу JK Noova'
    },

    uk: {
      // Навігація та Бренд
      'brand.academy': 'Academy',
      'brand.sub': 'Комплексне управління дитячо-юнацьким футболом',
      'nav.database': 'База даних',
      'nav.teams': 'Команди',
      'nav.calendar': 'Матчі',
      'nav.trainings': 'Тренування',
      'nav.transport': 'Транспорт',
      'nav.settings': '⚙️ Налаштування',
      'nav.newPlayer': 'Новий гравець',
      'nav.installApp': '📲 Встановити',

      // Мови
      'lang.select': 'Мова',
      'lang.es': '🇪🇸 Español',
      'lang.en': '🇬🇧 English',
      'lang.et': '🇪🇪 Eesti',
      'lang.ru': '🇷🇺 Русский',
      'lang.uk': '🇺🇦 Українська',

      // Portal de Familias (partido.html)
      'family.metaTitle': 'Інформація про матч | JK Noova Academy',
      'family.loading': 'Завантаження матчу...',
      'family.officialCategory': 'Офіційна категорія',
      'family.kickoff': 'Початковий свисток',
      'family.remainingTime': 'Час до початку',
      'family.pitch': 'Спортивний комплекс / Поле:',
      'family.fieldDefault': 'Футбольне поле',
      'family.getDirections': 'Маршрут у Google Maps',
      'family.transportTitle': 'Транспорт та мікроавтобуси',
      'family.officialFleet': 'Клубний транспорт',
      'family.officialVehicle': 'Офіційний автомобіль',
      'family.plate': 'Номерний знак',
      'family.departureTime': 'Час виїзду мікроавтобуса',
      'family.driver': 'Відповідальний водій',
      'family.seatsAssigned': 'Призначені місця в мікроавтобусі:',
      'family.seatsPending': 'Місця будуть розподілені перед виїздом.',
      'family.seatPlaza': 'Місце {seat}',
      'family.callupTitle': 'Список викликаних гравців',
      'family.callupEmpty': 'Список гравців на цей матч ще не опубліковано.',
      'family.callupCount': '{n} викликано',
      'family.calledUp': 'У СКЛАДІ',
      'family.clubVan': '🚐 Мікроавтобус клубу',
      'family.privateCar': '🚗 Власний автомобіль',
      'family.paid': '🟢 Оплачено',
      'family.pending': '⏳ Очікується',
      'family.matchLiveFinished': 'Матч триває / Завершено!',
      'family.dateTbd': 'Дата уточнюється',
      'family.atTime': 'о {time}',
      'family.footerAcademy': 'JK Noova Academy • Дитячо-юнацький футбол',
      'family.footerContact': 'З усіх питань звертайтеся до тренера або координатора.',
      'family.emptyTitle': 'Немає доступних матчів',
      'family.emptySubtitle': 'Зверніться до тренерського штабу JK Noova',

      // Сповіщення (Toast)
      'toast.saved': 'Успішно збережено',
      'toast.playerUpdated': 'Профіль гравця оновлено',
      'toast.playerCreated': 'Нового гравця зареєстровано',
      'toast.playerDeleted': 'Гравця видалено',
      'toast.teamUpdated': 'Команду оновлено',
      'toast.eventSaved': 'Подію збережено',
      'toast.attendanceSaved': 'Відвідуваність збережено',
      'toast.copied': 'Скопійовано в буфер обміну',
      'toast.error': 'Виникла помилка',
      'toast.required': 'Будь ласка, заповніть обовʼязкові поля (*)',
      'toast.backupDownloaded': 'Резервну копію завантажено',
      'toast.dataRestored': 'Дані успішно відновлено. Перезавантаження...'
    }
  };

  let currentLang = DEFAULT_LANG;

  function initI18n() {
    try {
      // 1. Parámetro en la URL (?lang=en / ?lang=uk / etc.)
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = (urlParams.get('lang') || '').toLowerCase();
      if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
        currentLang = urlLang;
        try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) {}
      } else {
        // 2. Preferencia guardada en localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGS.includes(saved)) {
          currentLang = saved;
        } else {
          // 3. Detección automática según el idioma del teléfono del usuario
          const navLangs = (navigator.languages && navigator.languages.length > 0)
            ? navigator.languages
            : [navigator.language || ''];
          let detected = null;
          for (const nl of navLangs) {
            const code = (nl || '').substring(0, 2).toLowerCase();
            if (SUPPORTED_LANGS.includes(code)) {
              detected = code;
              break;
            }
          }
          // Si el teléfono tiene un idioma soportado (es, en, et, ru, uk), lo adopta.
          // Si tiene otro idioma no contemplado (finés, alemán, polaco...), recurre a 'en' (Inglés).
          currentLang = detected || 'en';
        }
      }
    } catch (e) {
      currentLang = DEFAULT_LANG;
    }

    document.documentElement.lang = currentLang;

    // Sincronizar selectores si existen en el DOM
    const selectors = document.querySelectorAll('.lang-select, #lang-selector');
    selectors.forEach(sel => {
      if (sel.value !== currentLang) sel.value = currentLang;
    });

    applyTranslations();
  }

  function getLanguage() {
    return currentLang;
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}

    document.documentElement.lang = currentLang;

    // Actualizar selector si existe en el DOM
    const selectors = document.querySelectorAll('.lang-select, #lang-selector');
    selectors.forEach(sel => {
      if (sel.value !== currentLang) sel.value = currentLang;
    });

    applyTranslations();

    // Disparar evento para que los módulos dinámicos re-rendericen sus vistas
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  function t(key, paramsOrFallback, fallback) {
    let dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    let val = dict[key];

    if (val === undefined) {
      val = (TRANSLATIONS[DEFAULT_LANG] && TRANSLATIONS[DEFAULT_LANG][key]) !== undefined
        ? TRANSLATIONS[DEFAULT_LANG][key]
        : (typeof paramsOrFallback === 'string' ? paramsOrFallback : (fallback || key));
    }

    // Interpolación de parámetros {param}
    if (paramsOrFallback && typeof paramsOrFallback === 'object') {
      for (const p in paramsOrFallback) {
        val = val.replace(new RegExp(`\\{${p}\\}`, 'g'), paramsOrFallback[p]);
      }
    }

    return val;
  }

  function applyTranslations(rootElement) {
    const root = rootElement || document;

    // data-i18n: Reemplaza contenido de texto o innerHTML si contiene tags
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const text = t(key);
        if (text && text !== key) {
          if (text.includes('<') && text.includes('>')) {
            el.innerHTML = text;
          } else {
            el.textContent = text;
          }
        }
      }
    });

    // data-i18n-placeholder
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });

    // data-i18n-title
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });

    // data-i18n-aria
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
  }

  // Exponer al objeto global window.i18n y alias t()
  window.i18n = {
    init: initI18n,
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    t: t,
    applyTranslations: applyTranslations,
    SUPPORTED_LANGS: SUPPORTED_LANGS,
    TRANSLATIONS: TRANSLATIONS
  };

  window.t = t;

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();
