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
