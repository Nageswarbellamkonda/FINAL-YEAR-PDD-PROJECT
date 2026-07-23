// NyayaMitra Pilot Districts — Andhra Pradesh Only
// 5 Pilot Districts: Nellore, Tirupati (Chittoor), Vijayawada (Krishna), Visakhapatnam, Guntur
// Hierarchical: State → District → Circle → Mandal → Police Station

export const STATES_DATA = {
  "Andhra Pradesh": {
    districts: {
      "Visakhapatnam": {
        circles: {
          "Visakhapatnam City": {
            mandals: {
              "Gajuwaka": [
                { name: "Gajuwaka PS", address: "Gajuwaka Main Road", phone: "0891-2541100", lat: 17.6789, lng: 83.2083 },
                { name: "Bheemunipatnam PS", address: "Beach Road, Bheemunipatnam", phone: "08933-222100", lat: 17.8903, lng: 83.4582 },
                { name: "Malkapuram PS", address: "Malkapuram, Visakhapatnam", phone: "0891-2543200", lat: 17.7012, lng: 83.2456 },
              ],
              "Seethammadhara": [
                { name: "One Town PS", address: "Chittivalasa Rd, Visakhapatnam", phone: "0891-2888100", lat: 17.6916, lng: 83.2132 },
                { name: "MVP Colony PS", address: "MVP Colony Sector-8", phone: "0891-2795100", lat: 17.7425, lng: 83.3334 },
                { name: "Dwaraka Nagar PS", address: "Dwaraka Nagar Main Road", phone: "0891-2554100", lat: 17.7284, lng: 83.3153 },
                { name: "Rushikonda PS", address: "Rushikonda Beach Road", phone: "0891-2799100", lat: 17.7734, lng: 83.3789 },
                { name: "Gopalapatnam PS", address: "Gopalapatnam", phone: "0891-2713100", lat: 17.7456, lng: 83.2987 },
              ],
              "Anakapalli": [
                { name: "Anakapalli PS", address: "Main Road, Anakapalli", phone: "08924-222100", lat: 17.6912, lng: 82.9985 },
                { name: "Chodavaram PS", address: "Chodavaram", phone: "08926-232100", lat: 17.4567, lng: 82.8234 },
              ],
              "Kommadi": [
                { name: "Kommadi PS", address: "Kommadi, Visakhapatnam", phone: "0891-2799200", lat: 17.7823, lng: 83.3456 },
              ],
              "Pedagantyada": [
                { name: "Pedagantyada PS", address: "Pedagantyada", phone: "0891-2799300", lat: 17.7123, lng: 83.2234 },
              ],
            }
          },
          "Visakhapatnam Rural": {
            mandals: {
              "Araku": [
                { name: "Araku Valley PS", address: "Araku Valley", phone: "08936-245100", lat: 18.3273, lng: 82.8737 },
                { name: "Paderu PS", address: "Paderu", phone: "08936-220222", lat: 18.0734, lng: 82.6542 },
                { name: "Lambasingi PS", address: "Lambasingi, Chintapalli", phone: "08936-249100", lat: 17.9345, lng: 82.7234 },
              ],
              "Bheemunipatnam": [
                { name: "Bheemunipatnam Coastal PS", address: "Beach Road", phone: "08933-223100", lat: 17.8923, lng: 83.4712 },
              ],
            }
          }
        }
      },
      "Krishna": {
        circles: {
          "Vijayawada City": {
            mandals: {
              "Vijayawada Central": [
                { name: "Vijayawada One Town PS", address: "MG Road, Vijayawada", phone: "0866-2577100", lat: 16.5062, lng: 80.6480 },
                { name: "Vijayawada II Town PS", address: "Governorpet, Vijayawada", phone: "0866-2431100", lat: 16.5193, lng: 80.6311 },
                { name: "Benz Circle PS", address: "Benz Circle, Vijayawada", phone: "0866-2513100", lat: 16.5134, lng: 80.6023 },
                { name: "Auto Nagar PS", address: "Auto Nagar, Vijayawada", phone: "0866-2512100", lat: 16.4923, lng: 80.5834 },
                { name: "Gunadala PS", address: "Gunadala, Vijayawada", phone: "0866-2456100", lat: 16.5345, lng: 80.6123 },
                { name: "Patamata PS", address: "Patamata, Vijayawada", phone: "0866-2478100", lat: 16.5012, lng: 80.6245 },
              ],
              "Ibrahimpatnam": [
                { name: "Ibrahimpatnam PS", address: "Main Road, Ibrahimpatnam", phone: "0866-2889100", lat: 16.4723, lng: 80.7234 },
                { name: "Mylavaram PS", address: "Mylavaram", phone: "08676-222100", lat: 16.7512, lng: 80.6834 },
              ],
            }
          },
          "Krishna Rural": {
            mandals: {
              "Machilipatnam": [
                { name: "Machilipatnam Town PS", address: "Gandhi Nagar, Machilipatnam", phone: "08672-222100", lat: 16.1875, lng: 81.1389 },
                { name: "Gudivada PS", address: "Main Road, Gudivada", phone: "08674-222100", lat: 16.4334, lng: 80.9923 },
                { name: "Nandigama PS", address: "Nandigama", phone: "08671-222100", lat: 16.7812, lng: 80.2834 },
              ],
              "Nuzvid": [
                { name: "Nuzvid PS", address: "Main Road, Nuzvid", phone: "08675-222100", lat: 16.7912, lng: 80.8434 },
                { name: "Jaggayyapeta PS", address: "Jaggayyapeta", phone: "08677-222100", lat: 17.0123, lng: 80.0934 },
              ],
            }
          }
        }
      },
      "Guntur": {
        circles: {
          "Guntur City": {
            mandals: {
              "Guntur Urban": [
                { name: "Guntur Town PS", address: "Arundelpet, Guntur", phone: "0863-2228500", lat: 16.3067, lng: 80.4365 },
                { name: "Guntur II Town PS", address: "Brodipet, Guntur", phone: "0863-2224100", lat: 16.3015, lng: 80.4402 },
                { name: "Mangalagiri PS", address: "NH-16, Mangalagiri", phone: "0863-2476100", lat: 16.4296, lng: 80.5567 },
                { name: "Tadepalle PS", address: "Tadepalle", phone: "0863-2222100", lat: 16.4712, lng: 80.6023 },
              ],
              "Tenali": [
                { name: "Tenali Town PS", address: "Gandhi Nagar, Tenali", phone: "08644-222100", lat: 16.2424, lng: 80.6404 },
                { name: "Repalle PS", address: "Repalle Town", phone: "08648-222100", lat: 16.0123, lng: 80.8234 },
              ],
              "Narasaraopet": [
                { name: "Narasaraopet PS", address: "Main Road, Narasaraopet", phone: "08647-222100", lat: 16.2345, lng: 80.0512 },
                { name: "Bapatla PS", address: "Bapatla Town", phone: "08643-222100", lat: 15.9112, lng: 80.4623 },
              ],
            }
          },
          "Guntur Rural": {
            mandals: {
              "Sattenapalle": [
                { name: "Sattenapalle PS", address: "Main Road, Sattenapalle", phone: "08645-222100", lat: 16.3923, lng: 80.1534 },
                { name: "Vinukonda PS", address: "Vinukonda", phone: "08649-222100", lat: 16.0523, lng: 79.7334 },
              ],
              "Ponnur": [
                { name: "Ponnur PS", address: "Main Road, Ponnur", phone: "08646-222100", lat: 16.0623, lng: 80.5534 },
              ],
            }
          }
        }
      },
      "Nellore": {
        circles: {
          "Nellore City": {
            mandals: {
              "Nellore Urban": [
                { name: "Nellore Town PS", address: "Trunk Road, Nellore", phone: "0861-2325100", lat: 14.4426, lng: 79.9865 },
                { name: "Nellore II Town PS", address: "Grand Trunk Road", phone: "0861-2302100", lat: 14.4312, lng: 79.9723 },
                { name: "Nellore III Town PS", address: "Kota Road, Nellore", phone: "0861-2311100", lat: 14.4512, lng: 79.9934 },
              ],
              "Kavali": [
                { name: "Kavali Town PS", address: "Main Road, Kavali", phone: "08626-222100", lat: 14.9158, lng: 79.9947 },
                { name: "Atmakur PS", address: "Atmakur, Nellore", phone: "08628-222100", lat: 14.6234, lng: 79.6434 },
              ],
              "Gudur": [
                { name: "Gudur PS", address: "Station Road, Gudur", phone: "08624-222100", lat: 14.1512, lng: 79.8534 },
                { name: "Sullurpeta PS", address: "Main Road, Sullurpeta", phone: "08623-222100", lat: 13.9712, lng: 79.8923 },
                { name: "Naidupet PS", address: "Naidupet", phone: "08621-222100", lat: 13.9023, lng: 79.8712 },
              ],
            }
          },
          "Nellore Rural": {
            mandals: {
              "Podalakur": [
                { name: "Podalakur PS", address: "Main Road, Podalakur", phone: "08629-222100", lat: 14.6712, lng: 79.7934 },
              ],
              "Alluru": [
                { name: "Alluru PS", address: "Alluru", phone: "08622-222100", lat: 14.7212, lng: 80.0634 },
              ],
            }
          }
        }
      },
      "Chittoor": {
        circles: {
          "Tirupati": {
            mandals: {
              "Tirupati Urban": [
                { name: "Tirupati Town PS", address: "Gandhi Road, Tirupati", phone: "0877-2222100", lat: 13.6288, lng: 79.4192 },
                { name: "Tirupati Rural PS", address: "Bypass, Tirupati", phone: "0877-2251100", lat: 13.6123, lng: 79.4034 },
                { name: "Srikalahasti PS", address: "Main Road, Srikalahasti", phone: "08578-222100", lat: 13.7512, lng: 79.6923 },
                { name: "Renigunta PS", address: "Renigunta (Airport Area)", phone: "0877-2228100", lat: 13.6512, lng: 79.5134 },
              ],
              "Tirupati Rural": [
                { name: "Chandragiri PS", address: "Chandragiri Fort Area", phone: "08575-234100", lat: 13.5912, lng: 79.3123 },
                { name: "Yerpedu PS", address: "Yerpedu", phone: "08574-222100", lat: 13.7023, lng: 79.4834 },
              ],
            }
          },
          "Chittoor": {
            mandals: {
              "Chittoor Urban": [
                { name: "Chittoor Town PS", address: "Station Road, Chittoor", phone: "08572-222100", lat: 13.2172, lng: 79.1003 },
                { name: "Puttur PS", address: "Main Road, Puttur", phone: "08577-222100", lat: 13.4423, lng: 79.5534 },
                { name: "Kuppam PS", address: "Kuppam", phone: "08570-222100", lat: 12.7423, lng: 78.3434 },
              ],
              "Madanapalle": [
                { name: "Madanapalle Town PS", address: "Main Road, Madanapalle", phone: "08571-222100", lat: 13.5512, lng: 78.5044 },
                { name: "Punganur PS", address: "Punganur", phone: "08575-222100", lat: 13.3623, lng: 78.5712 },
              ],
            }
          }
        }
      },
    }
  }
};

// Flat list of all AP pilot district stations for map/search
export const ALL_POLICE_STATIONS = [];
Object.entries(STATES_DATA).forEach(([state, stateData]) => {
  Object.entries(stateData.districts).forEach(([district, distData]) => {
    Object.entries(distData.circles).forEach(([circle, circData]) => {
      Object.entries(circData.mandals).forEach(([mandal, stations]) => {
        stations.forEach(station => {
          ALL_POLICE_STATIONS.push({ ...station, state, district, circle, mandal });
        });
      });
    });
  });
});

export const AP_POLICE_STATIONS = ALL_POLICE_STATIONS;

// 5 Pilot Districts
export const PILOT_DISTRICTS = ["Visakhapatnam", "Krishna", "Guntur", "Nellore", "Chittoor"];

// District display names (Krishna = Vijayawada, Chittoor = Tirupati)
export const DISTRICT_DISPLAY = {
  "Visakhapatnam": "Visakhapatnam",
  "Krishna": "Vijayawada (Krishna)",
  "Guntur": "Guntur",
  "Nellore": "Nellore",
  "Chittoor": "Tirupati (Chittoor)",
};

export const DISTRICT_CENTERS = {
  "Visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "Krishna":        { lat: 16.5062, lng: 80.6480 },
  "Guntur":         { lat: 16.3067, lng: 80.4365 },
  "Nellore":        { lat: 14.4426, lng: 79.9865 },
  "Chittoor":       { lat: 13.6288, lng: 79.4192 },
};