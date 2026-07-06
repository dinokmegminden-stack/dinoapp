//we track here the size of the dinosaur images and their real-world height, so we can scale the character images accordingly

const imageCalibration = {
  "Allosaurus": {
    imageWidth: 1024,
    imageHeight: 588,
    topY: 212,
    groundY: 473,
    realHeightM: 2.8,
    pixelPerMeter: 93.21
  },
  "Arcovenator": {
  imageWidth: 1024,
  imageHeight: 589,
  topY: 218,
  groundY: 503,
  realHeightM: 2,
  pixelPerMeter: 142.50
},
"Neovenator": {
  imageWidth: 1024,
  imageHeight: 572,
  topY: 66,
  groundY: 504,
  realHeightM: 2.3,
  pixelPerMeter: 190.43
},

"Euoplocephalus": {
  imageWidth: 1376,
  imageHeight: 768,
  topY: 287,
  groundY: 702,
  realHeightM: 2.33,
  pixelPerMeter: 178.11
},

"Hatzegopteryx": {
  imageWidth: 1376,
  imageHeight: 768,
  topY: 48,
  groundY: 696,
  realHeightM: 5,
  pixelPerMeter: 129.60
},


};

export default imageCalibration;