/**
 * JK Noova Academy - OCR Parser
 * Analizador inteligente de texto OCR para capturas de perfil (Sportlyzer, EJL y fichas de club)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JKNoovaOCRParser = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const MONTHS_MAP = {
    // English
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09', 'sept': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12',
    // Estonian
    'jaanuar': '01',
    'veebruar': '02',
    'märts': '03', 'marts': '03',
    'aprill': '04',
    'mai': '05',
    'juuni': '06',
    'juuli': '07',
    'august': '08',
    'september': '09',
    'oktoober': '10', 'okt': '10',
    'november': '11',
    'detsember': '12',
    // Spanish
    'enero': '01',
    'febrero': '02',
    'marzo': '03',
    'abril': '04',
    'mayo': '05',
    'junio': '06',
    'julio': '07',
    'agosto': '08',
    'septiembre': '09', 'setiembre': '09',
    'octubre': '10',
    'noviembre': '11',
    'diciembre': '12',
    // Russian
    'января': '01', 'январь': '01',
    'февраля': '02', 'февраль': '02',
    'марта': '03', 'март': '03',
    'апреля': '04', 'апрель': '04',
    'мая': '05', 'май': '05',
    'июня': '06', 'июнь': '06',
    'июля': '07', 'июль': '07',
    'августа': '08', 'август': '08',
    'сентября': '09', 'сентябрь': '09',
    'октября': '10', 'октябрь': '10',
    'ноября': '11', 'ноябрь': '11',
    'декабря': '12', 'декабрь': '12'
  };

  /**
   * Decodifica un código personal estonio (Isikukood de 11 dígitos)
   * Devuelve { birthDate: 'YYYY-MM-DD', gender: 'Male'|'Female' } o null
   */
  function decodeEstonianId(idStr) {
    if (!idStr) return null;
    const clean = idStr.replace(/\D/g, '');
    if (clean.length !== 11) return null;

    const first = parseInt(clean[0], 10);
    if (first < 1 || first > 6) return null;

    let century = 1900;
    let gender = 'Male';
    if (first === 1 || first === 2) century = 1800;
    else if (first === 3 || first === 4) century = 1900;
    else if (first === 5 || first === 6) century = 2000;

    if (first % 2 === 0) gender = 'Female';

    const year = century + parseInt(clean.substring(1, 3), 10);
    const month = clean.substring(3, 5);
    const day = clean.substring(5, 7);

    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31) return null;

    return {
      birthDate: `${year}-${month}-${day}`,
      gender
    };
  }

  /**
   * Intenta parsear una cadena de fecha humana a ISO 'YYYY-MM-DD'
   */
  function parseHumanDate(dateStr) {
    if (!dateStr) return '';
    const clean = dateStr.trim();

    // 1. Formato ISO directo YYYY-MM-DD
    const isoMatch = clean.match(/\b(19\d\d|20\d\d)[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    // 2. Formato Europeo DD.MM.YYYY o DD/MM/YYYY
    const euroMatch = clean.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](19\d\d|20\d\d)\b/);
    if (euroMatch) {
      const d = String(euroMatch[1]).padStart(2, '0');
      const m = String(euroMatch[2]).padStart(2, '0');
      const y = euroMatch[3];
      return `${y}-${m}-${d}`;
    }

    // 3. Formato en texto: "October 27th, 2014", "27. oktoober 2014", "27 de octubre de 2014"
    const words = clean.toLowerCase().replace(/[,.]/g, ' ').replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1').split(/\s+/);
    
    let day = null;
    let month = null;
    let year = null;

    for (const w of words) {
      if (!w) continue;
      if (!month && MONTHS_MAP[w]) {
        month = MONTHS_MAP[w];
        continue;
      }
      const num = parseInt(w, 10);
      if (!isNaN(num)) {
        if (num >= 1990 && num <= 2030) {
          year = String(num);
        } else if (num >= 1 && num <= 31 && !day) {
          day = String(num).padStart(2, '0');
        }
      }
    }

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  /**
   * Deduce un nombre legible a partir de un correo electrónico
   * ej. pille.toomsalu@gmail.com -> Pille Toomsalu
   * ej. robinzahkna1@gmail.com -> Robin Zahkna
   */
  function nameFromEmail(email) {
    if (!email) return '';
    const prefix = email.split('@')[0];
    const clean = prefix.replace(/\d+$/, '');

    // Formato con punto: pille.toomsalu -> Pille Toomsalu
    if (clean.includes('.')) {
      return clean.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Formato con guion o guion bajo
    if (clean.includes('_') || clean.includes('-')) {
      return clean.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return '';
  }

  /**
   * Limpia y normaliza texto de líneas
   */
  function cleanLines(rawText) {
    if (!rawText) return [];
    return rawText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  /**
   * Extrae correos electrónicos de un texto
   */
  function extractEmails(text) {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi);
    return matches ? Array.from(new Set(matches.map(m => m.toLowerCase()))) : [];
  }

  /**
   * Extrae números de teléfono estonios o internacionales
   */
  function extractPhones(text) {
    const regex = /(?:\+?372[\s-]*)?(?:5\d{6,7}|5\d{2}[\s-]*\d{4,5}|8\d{6,7}|6\d{6,7}|7\d{6,7}|\d{7,8})/g;
    const matches = text.match(regex);
    if (!matches) return [];
    
    return Array.from(new Set(matches.map(p => {
      let cl = p.replace(/[\s-]/g, '');
      if (cl.length === 7 || cl.length === 8) {
        return cl;
      }
      return p.trim();
    }))).filter(p => {
      const digitsOnly = p.replace(/\D/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 12;
    });
  }

  /**
   * Normaliza un número de teléfono al formato estonio oficial:
   * +372 seguido de 7 u 8 dígitos.
   * Si ya tiene 372 al inicio, añade el símbolo +.
   * @param {string} rawPhone
   * @returns {string} Teléfono normalizado o cadena vacía
   */
  function formatEstonianPhone(rawPhone) {
    if (!rawPhone) return '';
    const str = String(rawPhone).trim();
    const digits = str.replace(/\D/g, '');
    if (!digits) return '';

    // Caso 1: Ya empieza con código de país 372 (ej. 37256732894 -> +37256732894)
    if (digits.startsWith('372')) {
      return `+372${digits.slice(3)}`;
    }

    // Caso 2: Empieza por 0 (ej. 056732894 -> +37256732894)
    if (digits.startsWith('0') && (digits.length === 8 || digits.length === 9)) {
      return `+372${digits.slice(1)}`;
    }

    // Caso 3: Número local de 7 u 8 dígitos (ej. 56732894 -> +37256732894)
    if (digits.length === 7 || digits.length === 8) {
      return `+372${digits}`;
    }

    // Caso 4: Longitud cercana a número estonio (6 a 10 dígitos)
    if (digits.length >= 6 && digits.length <= 10) {
      return `+372${digits}`;
    }

    // Caso 5: Internacional que ya tenía '+' (ej. +34612345678)
    if (str.startsWith('+')) {
      return `+${digits}`;
    }

    return `+372${digits}`;
  }

  /**
   * Determina el equipo asignado a un jugador a partir de su año de nacimiento:
   * Fórmula oficial de categorías: U-categoría = 2027 - añoDeNacimiento.
   * Ejemplos: 2017 -> U10, 2016 -> U11, 2015 -> U12, 2018/2019 -> U9.
   * @param {string|number} birthDateOrYear Fecha ISO YYYY-MM-DD o año numérico
   * @param {Array} availableTeams Lista de equipos del club
   * @returns {object} { teamId, teamName }
   */
  function assignTeamByBirthYear(birthDateOrYear, availableTeams = []) {
    if (!birthDateOrYear) return { teamId: '', teamName: '' };
    
    let year = null;
    if (typeof birthDateOrYear === 'number') {
      year = birthDateOrYear;
    } else if (typeof birthDateOrYear === 'string') {
      const m = birthDateOrYear.match(/\b(19\d\d|20\d\d)\b/);
      if (m) year = parseInt(m[1], 10);
    }
    
    if (!year || year < 2000 || year > 2030) {
      return { teamId: '', teamName: '' };
    }

    const targetU = 2027 - year;
    const targetUStr = `U${targetU}`;
    const yearStr = String(year);

    if (!Array.isArray(availableTeams) || availableTeams.length === 0) {
      return { teamId: `team_u${targetU}`, teamName: `${targetUStr} (${yearStr})` };
    }

    // 1. Coincidencia exacta por año de nacimiento en el nombre o descripción del equipo
    // ej. "U10 (2017) Jõhvi JK Noova", "U11 (2016) Jõhvi JK Noova"
    const exactYearTeam = availableTeams.find(t => 
      (t.name && (t.name.includes(`(${yearStr})`) || t.name.includes(yearStr))) ||
      (t.description && t.description.includes(yearStr))
    );
    if (exactYearTeam) {
      return { teamId: exactYearTeam.id, teamName: exactYearTeam.name };
    }

    // 2. Coincidencia por categoría U{targetU} (ej. "U10", "u10")
    const uTeam = availableTeams.find(t => {
      const n = (t.name || '').toLowerCase();
      const s = (t.shortName || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      const uLow = targetUStr.toLowerCase();
      return n.includes(uLow) || s.includes(uLow) || id.includes(uLow);
    });
    if (uTeam) {
      return { teamId: uTeam.id, teamName: uTeam.name };
    }

    // 3. Si el jugador es mayor que el equipo más veterano o menor que el más joven
    const sortedTeams = [...availableTeams].sort((a, b) => {
      const getUNum = t => {
        const match = (t.name || t.id || '').match(/U[-_\s]?(\d{1,2})/i);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getUNum(b) - getUNum(a); // descendente: U12, U11, U10, U9
    });

    if (targetU >= 12 && sortedTeams.length > 0) {
      return { teamId: sortedTeams[0].id, teamName: sortedTeams[0].name };
    }
    if (targetU <= 9 && sortedTeams.length > 0) {
      return { teamId: sortedTeams[sortedTeams.length - 1].id, teamName: sortedTeams[sortedTeams.length - 1].name };
    }

    return { teamId: availableTeams[0].id, teamName: availableTeams[0].name };
  }

  /**
   * Parser principal que analiza el texto OCR completo
   * @param {string} rawText Texto devuelto por Tesseract OCR
   * @param {Array} availableTeams Lista de equipos disponibles en el club (opcional)
   * @returns {object} Objeto con los campos normalizados
   */
  function parseProfileScreenshot(rawText, availableTeams = []) {
    const lines = cleanLines(rawText);
    const fullText = lines.join('\n');

    const result = {
      name: '',
      lastName: '',
      fullName: '',
      nickname: '',
      dorsal: null,
      birthDate: '',
      gender: '',
      isikukood: '',
      teamId: '',
      teamName: '',
      playerEmail: '',
      playerPhone: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianRelation: 'Madre',
      rawText: fullText
    };

    // 1. Extraer Isikukood estonio (11 dígitos continuos)
    const isikukoodMatch = fullText.match(/\b([1-6]\d{10})\b/);
    if (isikukoodMatch) {
      result.isikukood = isikukoodMatch[1];
      const decoded = decodeEstonianId(result.isikukood);
      if (decoded) {
        result.birthDate = decoded.birthDate;
        result.gender = decoded.gender;
      }
    }

    // 2. Extraer correos electrónicos
    const allEmails = extractEmails(fullText);
    if (allEmails.length > 0) {
      result.playerEmail = allEmails[0];
    }

    // El correo del tutor DEBE provenir EXCLUSIVAMENTE de la sección de tutores / Contact Persons
    const guardianHeaderRegex = /contact\s*persons|guardians|kontaktisikud|tutores|hooldajad/i;
    const guardianIdx = fullText.search(guardianHeaderRegex);
    
    if (guardianIdx !== -1) {
      const guardianSectionText = fullText.substring(guardianIdx);
      const guardianEmails = extractEmails(guardianSectionText);
      if (guardianEmails.length > 0) {
        result.guardianEmail = guardianEmails[0];
      } else {
        result.guardianEmail = ''; // NUNCA tomar el correo del jugador
      }
    } else {
      // Si no hay encabezado explícito pero hay 2 o más correos, el último es el del tutor
      if (allEmails.length >= 2) {
        result.guardianEmail = allEmails[allEmails.length - 1];
      } else {
        result.guardianEmail = '';
      }
    }

    // 3. Extraer Fecha de nacimiento si no se obtuvo por Isikukood
    if (!result.birthDate) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (/date\s*of\s*birth|sünniaeg|fecha\s*de\s*nacimiento|birthdate/i.test(l)) {
          // La fecha puede estar en la misma línea o en la siguiente
          let candidate = l.replace(/date\s*of\s*birth|sünniaeg|fecha\s*de\s*nacimiento|birthdate/gi, '').trim();
          let parsed = parseHumanDate(candidate);
          if (!parsed && i + 1 < lines.length) {
            candidate = lines[i + 1].trim();
            parsed = parseHumanDate(candidate);
          }
          if (parsed) {
            result.birthDate = parsed;
            break;
          }
        }
      }
    }

    // 4. Extraer Número de jugador (Player Number / Dorsal)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/player\s*number|dorsal|número\s*de\s*jugador|särginumber/i.test(l)) {
        // En la misma línea: "Player Number 19"
        const inlineMatch = l.match(/\b([1-9][0-9]?)\b/);
        if (inlineMatch) {
          result.dorsal = parseInt(inlineMatch[1], 10);
          break;
        } else if (i + 1 < lines.length) {
          // En la línea siguiente
          const nextLineMatch = lines[i + 1].match(/\b([1-9][0-9]?)\b/);
          if (nextLineMatch) {
            result.dorsal = parseInt(nextLineMatch[1], 10);
            break;
          }
        }
      }
    }

    // Si aún no se encontró dorsal, buscar etiqueta "19" en caja aislada
    if (!result.dorsal) {
      const isolatedNumberMatch = fullText.match(/(?:player\s*number|number|dorsal)[\s\S]{0,30}?\b([1-9][0-9]?)\b/i);
      if (isolatedNumberMatch) {
        result.dorsal = parseInt(isolatedNumberMatch[1], 10);
      }
    }

    // 5. Extraer Nombre y Apellidos del Jugador (Cabecera superior)
    const systemKeywords = [
      'personal information', 'attendance', 'medical', 'billing', 'activity',
      'this user has logged in', 'created an account', 'their name and email',
      'can only be changed', 'contact persons', 'guardians', 'nationality',
      'competition category', 'playing level', 'tax refund', 'add notes',
      'isikukood', 'date of birth', 'sünniaeg', 'player number'
    ];
    const badgeRegex = /\b(athlete|active|sportlane|aktiivne|deportista|activo|member|treener|coach|jugador|nombre\s*y\s*apellidos|nombre|apellidos)\b/gi;

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      let line = lines[i];
      if (!line) continue;

      const lower = line.toLowerCase();
      if (systemKeywords.some(kw => lower.includes(kw))) continue;
      if (line.includes('@') || line.includes('http') || /\b\d{4,}\b/.test(line)) continue;

      // 1. Quitar iniciales de avatar al inicio tipo "RZ Robin Zahkna" o "RZ"
      let cleaned = line.replace(/^[A-Z]{1,3}\s+/, '').trim();
      // 2. Quitar insignias ("Athlete", "Active", etc.)
      cleaned = cleaned.replace(badgeRegex, '').trim();
      // 3. Quitar símbolos extraños
      cleaned = cleaned.replace(/[«»©®™*~—|\[\]_#><=\\/]/g, ' ').trim();
      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && !/\d/.test(w));
      if (words.length >= 2 && words.length <= 4) {
        const formattedWords = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        result.name = formattedWords[0];
        result.lastName = formattedWords.slice(1).join(' ');
        result.fullName = `${result.name} ${result.lastName}`;
        break;
      }
    }

    // Heurística de refinamiento o respaldo desde correo electrónico
    if (result.name && (result.playerEmail || allEmails[0])) {
      const emailUser = (result.playerEmail || allEmails[0]).split('@')[0].toLowerCase().replace(/\d+$/, '');
      const nameLow = result.name.toLowerCase();
      if (emailUser.startsWith(nameLow)) {
        const rest = emailUser.slice(nameLow.length);
        if (rest.length >= 2) {
          result.lastName = rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase();
          result.fullName = `${result.name} ${result.lastName}`;
        }
      }
    } else if (!result.name && result.playerEmail) {
      const emailName = nameFromEmail(result.playerEmail);
      if (emailName) {
        const parts = emailName.split(' ');
        result.name = parts[0];
        result.lastName = parts.slice(1).join(' ');
        result.fullName = emailName;
      }
    }

    // 6. Extraer Sección de Contactos de Tutores (Contact Persons / Guardians)
    const guardianSectionIdx = lines.findIndex(l => /contact\s*persons|guardians|kontaktisikud|tutores|hooldajad/i.test(l));
    if (guardianSectionIdx !== -1) {
      for (let i = guardianSectionIdx + 1; i < Math.min(lines.length, guardianSectionIdx + 10); i++) {
        const line = lines[i];
        if (!line) continue;

        // Detectar nombre del tutor (2-3 palabras alfabéticas sin @)
        if (!result.guardianName && !line.includes('@') && !/\d/.test(line)) {
          const gWords = line.split(/\s+/).filter(w => w.length >= 2);
          if (gWords.length >= 2 && gWords.length <= 4) {
            const hasSystemWords = /email|can log in|phone|national|personal|address|notes|male|female|billing/i.test(line);
            if (!hasSystemWords) {
              result.guardianName = gWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }
          }
        }

        // Detectar teléfono en la sección de tutores
        if (!result.guardianPhone) {
          const phones = extractPhones(line);
          if (phones.length > 0) {
            result.guardianPhone = formatEstonianPhone(phones[0]);
          }
        }

        // Detectar correo en la sección de tutores
        if (!result.guardianEmail && line.includes('@')) {
          const em = extractEmails(line);
          if (em.length > 0) {
            result.guardianEmail = em[0];
          }
        }
      }
    }

    // Heurística de respaldo para nombre de tutor desde su correo electrónico (ej. pille.toomsalu@gmail.com -> Pille Toomsalu)
    if (!result.guardianName && result.guardianEmail) {
      const derived = nameFromEmail(result.guardianEmail);
      if (derived) {
        result.guardianName = derived;
      }
    }

    // Si aún no se encontró teléfono del tutor pero hay un teléfono general en el texto
    if (!result.guardianPhone) {
      const allPhones = extractPhones(fullText);
      if (allPhones.length > 0) {
        result.guardianPhone = formatEstonianPhone(allPhones[allPhones.length - 1]);
        if (allPhones.length > 1) {
          result.playerPhone = formatEstonianPhone(allPhones[0]);
        }
      }
    } else {
      result.guardianPhone = formatEstonianPhone(result.guardianPhone);
    }

    // 7. Detección y Asignación de Equipo por Año de Nacimiento (Fórmula: U = 2027 - año)
    if (result.birthDate) {
      const teamMatch = assignTeamByBirthYear(result.birthDate, availableTeams);
      if (teamMatch && teamMatch.teamId) {
        result.teamId = teamMatch.teamId;
        result.teamName = teamMatch.teamName;
      }
    }

    // Fallback: Si no se detectó por año, buscar etiquetas directas U-12, U-10, etc. en el texto
    if (!result.teamId) {
      const categoryMatch = fullText.match(/\bU[-_\s]?(\d{1,2})\b/i);
      if (categoryMatch) {
        const uNumber = categoryMatch[1];
        result.teamName = `U${uNumber}`;

        if (Array.isArray(availableTeams) && availableTeams.length > 0) {
          const matched = availableTeams.find(t => 
            (t.name && t.name.toLowerCase().includes(`u${uNumber}`)) ||
            (t.shortName && t.shortName.toLowerCase().includes(`u${uNumber}`)) ||
            (t.id && t.id.toLowerCase().includes(`u${uNumber}`))
          );
          if (matched) {
            result.teamId = matched.id;
            result.teamName = matched.name;
          }
        }
      }
    }

    return result;
  }

  return {
    decodeEstonianId,
    parseHumanDate,
    extractEmails,
    extractPhones,
    formatEstonianPhone,
    assignTeamByBirthYear,
    nameFromEmail,
    parseProfileScreenshot
  };
}));
