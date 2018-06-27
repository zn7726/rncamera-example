
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { RNCamera } from 'react-native-camera';
import  Canvas  from 'react-native-canvas';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';

const landmarkSize = 2;
const base64_image_header = 'data:image/jpeg;base64';

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

const wbOrder = {
  auto: 'sunny',
  sunny: 'cloudy',
  cloudy: 'shadow',
  shadow: 'fluorescent',
  fluorescent: 'incandescent',
  incandescent: 'auto',
};

export default class CameraScreen extends React.Component {
  state = {
    flash: 'off',
    zoom: 0,
    autoFocus: 'on',
    depth: 0,
    type: 'back',
    whiteBalance: 'auto',
    ratio: '16:9',
    ratios: [],
    photoId: 1,
    showGallery: false,
    photos: [],
    faces: [],
    cameraPreviewWidth: 0,
    cameraPreviewHeight: 0,
    cameraPreviewOffsetX: 0,
    cameraPreviewOffsetY: 0,
    canvasCtx: 0
  };

  getRatios = async function() {
    const ratios = await this.camera.getSupportedRatios();
    return ratios;
  };

  toggleView() {
    this.setState({
      showGallery: !this.state.showGallery,
    });
  }

  toggleFacing() {
    this.setState({
      type: this.state.type === 'back' ? 'front' : 'back',
    });
  }

  toggleFlash() {
    this.setState({
      flash: flashModeOrder[this.state.flash],
    });
  }

  setRatio(ratio) {
    this.setState({
      ratio,
    });
  }

  toggleWB() {
    this.setState({
      whiteBalance: wbOrder[this.state.whiteBalance],
    });
  }

  toggleFocus() {
    this.setState({
      autoFocus: this.state.autoFocus === 'on' ? 'off' : 'on',
    });
  }

  zoomOut() {
    this.setState({
      zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1,
    });
  }

  zoomIn() {
    this.setState({
      zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1,
    });
  }

  setFocusDepth(depth) {
    this.setState({
      depth,
    });
  }

  takePicture = async function() {
    if (this.camera && this.state.canvas) {
      // this.camera.takePictureAsync().then(data => {
      //   console.log('data: ', data);
      // });

      this.state.canvas.toDataURL('image/jpeg')
        .then((data) => {
          // By the way here data is wrapped in quotes by some reason, so we need to remove them
          data = data.substring(1);
          data = data.slice(0, -1);

          if (data.indexOf(base64_image_header) > -1) {
            // Removing "data:image/jpeg;base64," for saving into file as base64 data
            data = data.substring(base64_image_header.length);
          }

          const imagePath = RNFS.DocumentDirectoryPath+'/image.jpg';

          RNFetchBlob.fs.writeFile(imagePath, data, 'base64')
            .then(
              Image.getSize('file://'+imagePath, (width, height) => {
                console.log('saved image size: ' + width, height);
              })
            );
        });

      //this.setState({ canvasImgUrl: imageData, showGallery: true });
    }
  };

  onFacesDetected = ({ faces }) => this.setState({ faces });
  onFaceDetectionError = state => console.warn('Faces detection error:', state);

  renderFace(face, ctx) {

    const  { bounds, faceID, rollAngle, yawAngle } = face;
    // return (
    //   <View
    //     key={faceID}
    //     transform={[
    //       { perspective: 600 },
    //       { rotateZ: `${rollAngle.toFixed(0)}deg` },
    //       { rotateY: `${yawAngle.toFixed(0)}deg` },
    //     ]}
    //     style={[
    //       styles.face,
    //       {
    //         ...bounds.size,
    //         left: bounds.origin.x,
    //         top: bounds.origin.y,
    //       },
    //     ]}
    //   >
    //     <Text style={styles.faceText}>ID: {faceID}</Text>
    //     <Text style={styles.faceText}>rollAngle: {rollAngle.toFixed(0)}</Text>
    //     <Text style={styles.faceText}>yawAngle: {yawAngle.toFixed(0)}</Text>
    //   </View>
    // );
    console.log(ctx);

    const x = this.state.cameraPreviewOffsetX;
    const y = this.state.cameraPreviewOffsetY;

    ctx.strokeStyle = 'green';
    ctx.strokeRect((bounds.origin.x-x), (bounds.origin.y-y), bounds.size.width, bounds.size.height);
  }

  renderLandmarksOfFace(face) {
    const renderLandmark = position =>
      position && (
        <View
          style={[
            styles.landmark,
            {
              left: position.x - landmarkSize / 2,
              top: position.y - landmarkSize / 2,
            },
          ]}
        />
      );
    return (
      <View key={`landmarks-${face.faceID}`}>
        {renderLandmark(face.leftEyePosition)}
        {renderLandmark(face.rightEyePosition)}
        {renderLandmark(face.leftEarPosition)}
        {renderLandmark(face.rightEarPosition)}
        {renderLandmark(face.leftCheekPosition)}
        {renderLandmark(face.rightCheekPosition)}
        {renderLandmark(face.leftMouthPosition)}
        {renderLandmark(face.mouthPosition)}
        {renderLandmark(face.rightMouthPosition)}
        {renderLandmark(face.noseBasePosition)}
        {renderLandmark(face.bottomMouthPosition)}
      </View>
    );
  }

  renderFaces() {
    if(this.canvas) {
      if(this.state.canvasCtx === 0) {
        this.canvas.width = this.state.cameraPreviewWidth;
        this.canvas.height = this.state.cameraPreviewHeight;

        this.setState({canvasCtx: this.canvas.getContext('2d'), canvas: this.canvas});
      }
      // ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // console.log(this.canvas.width, this.canvas.height);

      var ctx = this.state.canvasCtx;

      return (
        <View style={styles.facesContainer} pointerEvents="none">
          {this.state.faces.map((face) => this.renderFace(face, ctx))}
        </View>
      );
    }
  }

  renderLandmarks() {
    return (
      <View style={styles.facesContainer} pointerEvents="none">
        {this.state.faces.map(this.renderLandmarksOfFace)}
      </View>
    );
  }

  updatePreviewWindowSize(event) {
    if(event) {
      const {x, y, width, height} = event.nativeEvent.layout;

      console.log(event.nativeEvent.layout);

      this.setState({
        cameraPreviewWidth: width,
        cameraPreviewHeight: height,
        cameraPreviewOffsetX: x,
        cameraPreviewOffsetY: y,
      });

    }
  }

  renderCamera() {
    return (
      <View style={{
        flex: 1,
        flexDirection: 'column'
      }}>
        <View
          style={{
            flex: 0.1,
            flexDirection: 'row',
            height: 40,
            justifyContent: 'space-around',
          }}
        >
          <TouchableOpacity style={styles.flipButton} onPress={this.toggleFacing.bind(this)}>
            <Text style={styles.flipText}> FLIP </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.flipButton} onPress={this.toggleFlash.bind(this)}>
            <Text style={styles.flipText}> FLASH: {this.state.flash} </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.flipButton} onPress={this.toggleWB.bind(this)}>
            <Text style={styles.flipText}> WB: {this.state.whiteBalance} </Text>
          </TouchableOpacity>
        </View>
        <View style={{flex: 0.8,}}
              onLayout={(event)=>this.updatePreviewWindowSize(event)}>
      <RNCamera
        ref={ref => {
          this.camera = ref;
        }}
        style={{
          flex: 1
        }}
        type={this.state.type}
        flashMode={this.state.flash}
        autoFocus={this.state.autoFocus}
        zoom={this.state.zoom}
        whiteBalance={this.state.whiteBalance}
        ratio={this.state.ratio}
        faceDetectionLandmarks={RNCamera.Constants.FaceDetection.Landmarks.all}
        onFacesDetected={this.onFacesDetected}
        onFaceDetectionError={this.onFaceDetectionError}
        focusDepth={this.state.depth}
        permissionDialogTitle={'Permission to use camera'}
        permissionDialogMessage={'We need your permission to use your camera phone'}
      >
        <Canvas
          ref={ref => {
            this.canvas = ref;
          }}
          style={{flex:1}}
        />
        {this.renderFaces()}

      </RNCamera>

        </View>
        <View
          style={{
            flex: 0.1,
            height: 20,
            flexDirection: 'row',
            alignSelf: 'flex-end',
          }}
        >
          <TouchableOpacity
            style={[styles.flipButton, { flex: 0.1, alignSelf: 'flex-end' }]}
            onPress={this.zoomIn.bind(this)}
          >
            <Text style={styles.flipText}> + </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flipButton, { flex: 0.1, alignSelf: 'flex-end' }]}
            onPress={this.zoomOut.bind(this)}
          >
            <Text style={styles.flipText}> - </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flipButton, { flex: 0.25, alignSelf: 'flex-end' }]}
            onPress={this.toggleFocus.bind(this)}
          >
            <Text style={styles.flipText}> AF : {this.state.autoFocus} </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flipButton, styles.picButton, { flex: 0.3, alignSelf: 'flex-end' }]}
            onPress={this.takePicture.bind(this)}
          >
            <Text style={styles.flipText}> SNAP </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.flipButton, styles.galleryButton, { flex: 0.25, alignSelf: 'flex-end' }]}
            onPress={this.toggleView.bind(this)}
          >
            <Text style={styles.flipText}> Gallery </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {
    if(this.state.showGallery) {
      return (
        <View style={{flex:1}}>
          <Image
            source={{ uri: 'file://'+this.state.canvasImgUrl+'1' }}
            style={{
              height: 600,
              width: 400
            }}
          />
        </View>
      )
    }else{
      return <View style={styles.container}>{this.renderCamera()}</View>
    }

  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#000',
  },
  navigation: {
    flex: 1,
  },
  gallery: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flipButton: {
    flex: 0.3,
    height: 40,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 20,
    borderRadius: 8,
    borderColor: 'white',
    borderWidth: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipText: {
    color: 'white',
    fontSize: 15,
  },
  item: {
    margin: 4,
    backgroundColor: 'indianred',
    height: 35,
    width: 80,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picButton: {
    backgroundColor: 'darkseagreen',
  },
  galleryButton: {
    backgroundColor: 'indianred',
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  face: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  landmark: {
    width: landmarkSize,
    height: landmarkSize,
    position: 'absolute',
    backgroundColor: 'red',
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
});