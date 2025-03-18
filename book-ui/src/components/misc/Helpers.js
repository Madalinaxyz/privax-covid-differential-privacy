export const handleLogError = (error) => {
  if (error.response) {
    console.log(error.response.data)
  } else if (error.request) {
    console.log(error.request)
  } else {
    console.log(error.message)
  }
}


export const cityCoordinates = {
  "Bucharest": { lat: 44.4268, lng: 26.1025 },
  "Cluj-Napoca": { lat: 46.7709, lng: 23.5899 },
  "Timișoara": { lat: 45.7489, lng: 21.2087 },
  "Iași": { lat: 47.1585, lng: 27.6014 },
  "Constanța": { lat: 44.1733, lng: 28.6500 },
  "Craiova": { lat: 44.3302, lng: 23.7949 },
  "Brașov": { lat: 45.6556, lng: 25.6108 },
  "Galați": { lat: 45.4353, lng: 28.0076 },
  "Ploiești": { lat: 44.9362, lng: 26.0129 },
  "Oradea": { lat: 47.0465, lng: 21.9189 },
  "Brăila": { lat: 45.2692, lng: 27.9575 },
  "Arad": { lat: 46.1667, lng: 21.3167 },
  "Pitești": { lat: 44.8565, lng: 24.8692 },
  "Sibiu": { lat: 45.7928, lng: 24.1521 },
  "Bacău": { lat: 46.5676, lng: 26.9133 },
  "Târgu Mureș": { lat: 46.5424, lng: 24.5571 },
  "Baia Mare": { lat: 47.6597, lng: 23.5819 },
  "Buzău": { lat: 45.1517, lng: 26.8163 },
  "Satu Mare": { lat: 47.7921, lng: 22.8859 },
  "Râmnicu Vâlcea": { lat: 45.0997, lng: 24.3693 },
  "Drobeta-Turnu Severin": { lat: 44.6317, lng: 22.6561 },
  "Botoșani": { lat: 47.7486, lng: 26.6694 },
  "Reșița": { lat: 45.3008, lng: 21.8881 },
  "Deva": { lat: 45.8761, lng: 22.9119 },
  "Slatina": { lat: 44.4281, lng: 24.3603 },
  "Focșani": { lat: 45.6967, lng: 27.1867 },
  "Vaslui": { lat: 46.6407, lng: 27.7276 },
  "Târgoviște": { lat: 44.9252, lng: 25.4563 },
  "Bistrița": { lat: 47.1325, lng: 24.5006 }
};



export const applyDifferentialPrivacy = (data, epsilon) => {
  return data.map(report => ({
    ...report,
    age: clamp(Math.floor(report.age + laplaceNoise(epsilon)), 18, 80), // ✅ Ensures age stays between 18-80
    severity: randomizeSeverity(report.severity, epsilon),
    vaccineName: randomizeVaccine(report.vaccineName, epsilon),
    city: randomizeCity(report.city, epsilon),
    symptoms: randomizeSymptoms(report.symptoms, epsilon),
  }));
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));


const laplaceNoise = (epsilon) => {
  const sensitivity = 5.0;
  const scale = sensitivity / epsilon;
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u)); 
};


const randomizeSeverity = (original, epsilon) => {
  if (Math.random() < (1 / epsilon)) {
    const severities = ["MILD", "MODERATE", "SEVERE", "FATAL"];
    return severities[Math.floor(Math.random() * severities.length)];
  }
  return original;
};

const randomizeVaccine = (original, epsilon) => {
  if (Math.random() < (1 / epsilon)) {
    const vaccines = ["Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson"];
    return vaccines[Math.floor(Math.random() * vaccines.length)];
  }
  return original;
};

const randomizeCity = (original, epsilon) => {
  if (Math.random() < (1 / epsilon)) {
    const cities = ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Brașov", "Constanța"];
    return cities[Math.floor(Math.random() * cities.length)];
  }
  return original;
};

const randomizeSymptoms = (originalSymptoms, epsilon) => {
  const symptomsList = ["Fatigue", "Fever", "Headache", "Muscle Pain", "Chills", "Dizziness"];
  let newSymptoms = [...originalSymptoms];

  if (Math.random() < (1 / epsilon)) {
    newSymptoms.push(symptomsList[Math.floor(Math.random() * symptomsList.length)]);
  }

  if (Math.random() < (1 / epsilon) && newSymptoms.length > 0) {
    newSymptoms.splice(Math.floor(Math.random() * newSymptoms.length), 1);
  }

  return newSymptoms;
};
