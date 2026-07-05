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
};

export default imageCalibration;