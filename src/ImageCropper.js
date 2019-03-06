import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  PixelRatio,
  PanResponder,
} from 'react-native';
import { Surface } from 'gl-react-native';
import GLImage from './GLImage';


const imageDimensionsAfterZoom = (viewport, dimensions, zoom) => {
  const ImageRatio = dimensions.width / dimensions.height;
  const ViewportRatio = viewport.width / viewport.height;
  if (ImageRatio > ViewportRatio) {
    return {
      height: Math.floor(viewport.height / zoom),
      width: Math.floor((viewport.height * ImageRatio) / zoom),
    };
  }
  return {
    height: Math.floor((viewport.width / ImageRatio) / zoom),
    width: Math.floor(viewport.width / zoom),
  };
};

const movementFromZoom = (gestureState, dimensions, offsets, zoom) => {
  // X-axis
  const pxVsMovX = (1 / dimensions.width);
  const moveX = (gestureState.dx * pxVsMovX) * zoom;
  const newPosX = (parseFloat(offsets.x) - parseFloat(moveX));
  // Y-axis
  const pxVsMovY = (1 / dimensions.height);
  const moveY = (gestureState.dy * pxVsMovY) * zoom;
  const newPosY = (parseFloat(offsets.y) - parseFloat(moveY));
  return {
    x: newPosX,
    y: newPosY,
  };
};


class ImageCropper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 1,
      // pan settings
      centerX: 0.5,
      centerY: 0.5,
      // Image sizes
      imageHeight: 300,
      imageWidth: 300,
      imageDimHeight: 0,
      imageDimWidth: 0,
    };
  }

  componentWillMount = () => {
    Image.getSize(this.props.image, (width, height) => (
      this.setState({
        imageHeight: height,
        imageWidth: width,
      })
    ));

    // get dimensions after crop
    this._dimensionAfterZoom = imageDimensionsAfterZoom(
      { height: this.props.cropHeight, width: this.props.cropWidth },
      { height: this.state.imageHeight, width: this.state.imageWidth },
      this.state.zoom,
    );

    this.setState({
      imageDimHeight: this._dimensionAfterZoom.height,
      imageDimWidth: this._dimensionAfterZoom.width,
    });

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => {
        // move variables
        this.offsetX = this.state.centerX;
        this.offsetY = this.state.centerY;
        // zoom variables
        this.zoomLastDistance = 0;
        this.zoomCurrentDistance = 0;
      },

      onPanResponderMove: (evt, gestureState) => {
        // We are moving the image
        if (evt.nativeEvent.changedTouches.length <= 1) {
          const trackX = (gestureState.dx / this.props.cropWidth) * this.state.zoom;
          const trackY = (gestureState.dy / this.props.cropHeight) * this.state.zoom;
          let newPosX = (Number(this.offsetX) - Number(trackX));
          let newPosY = (Number(this.offsetY) - Number(trackY));
          if (newPosX > 1) newPosX = Number(1);
          if (newPosY > 1) newPosY = Number(1);
          if (newPosX < 0) newPosX = Number(0);
          if (newPosY < 0) newPosY = Number(0);

          const movement = movementFromZoom(
            gestureState,
            { width: this.state.imageDimWidth, height: this.state.imageDimHeight },
            { x: this.offsetX, y: this.offsetY },
            this.state.zoom,
          );
          this.setState({ centerX: movement.x });
          this.setState({ centerY: movement.y });
        }
        // We are zooming the image
        if (this.zoomLastDistance === 0) {
          const a = evt.nativeEvent.changedTouches[0].locationX -
            evt.nativeEvent.changedTouches[1].locationX;
          const b = evt.nativeEvent.changedTouches[0].locationY -
            evt.nativeEvent.changedTouches[1].locationY;
          const c = Math.sqrt(a * a + b * b);
          this.zoomLastDistance = c.toFixed(1);
        } else {
          const a = evt.nativeEvent.changedTouches[0].locationX -
            evt.nativeEvent.changedTouches[1].locationX;
          const b = evt.nativeEvent.changedTouches[0].locationY -
            evt.nativeEvent.changedTouches[1].locationY;
          const c = Math.sqrt(a * a + b * b);
          this.zoomCurrentDistance = c.toFixed(1);
          const distance = (this.zoomCurrentDistance - this.zoomLastDistance) / 400;
          let zoom = this.state.zoom - distance;
          if (zoom < 0) zoom = 0.0000001;
          if (zoom > 1) zoom = 1;
          this.setState({ zoom });
          // Set last distance..
          this.zoomLastDistance = this.zoomCurrentDistance;
        }
      },
    });
  }

  componentWillReceiveProps = (nextProps) => {
    // Update image size on image props update
    Image.getSize(nextProps.image, (width, height) => (
      this.setState({
        imageHeight: height,
        imageWidth: width,
      })
    ));

    if (this.props.zoom !== nextProps.zoom) {
      const zoom = (100 - nextProps.zoom) / 100;
      this.setState({ zoom });
    }

    // get dimensions after crop
    this._dimensionAfterZoom = imageDimensionsAfterZoom(
      { height: this.props.cropHeight, width: this.props.cropWidth },
      { height: this.state.imageHeight, width: this.state.imageWidth },
      this.state.zoom,
    );

    this.setState({
      imageDimHeight: this._dimensionAfterZoom.height,
      imageDimWidth: this._dimensionAfterZoom.width,
    });
  }

  crop = () => {
    return this.surface.captureFrame({
      quality: this.props.quality,
      type: this.props.type,
      format: this.props.format,
      filePath: this.props.filePath,
    });
  }

  render = () => {
    return (
      <View {...this._panResponder.panHandlers}>
        <Surface
          ref={(ref) => { this.surface = ref; }}
          width={this.props.cropWidth}
          height={this.props.cropHeight}
          pixelRatio={this.props.pixelRatio}
          backgroundColor="transparent"
        >
          <GLImage
            source={{ uri: this.props.image }}
            imageSize={{ height: this.state.imageHeight, width: this.state.imageWidth }}
            resizeMode="cover"
            zoom={this.state.zoom}
            center={[this.state.centerX, this.state.centerY]}
          />
        </Surface>
      </View>
    );
  }
}

ImageCropper.propTypes = {
  image: PropTypes.string,
  cropWidth: PropTypes.number,
  cropHeight: PropTypes.number,
  zoomFactor: PropTypes.number,
  zoom: PropTypes.number,
  maxZoom: PropTypes.number,
  minZoom: PropTypes.number,
  quality: PropTypes.number,
  pixelRatio: PropTypes.number,
  type: PropTypes.string,
  format: PropTypes.string,
  filePath: PropTypes.string,
};

ImageCropper.defaultProps = {
  image: '',
  cropWidth: 300,
  cropHeight: 300,
  zoomFactor: 0,
  zoom: 0,
  minZoom: 0,
  maxZoom: 100,
  quality: 1,
  pixelRatio: PixelRatio.get(),
  type: 'jpg',
  format: 'base64',
  filePath: '',
};

module.exports = ImageCropper;
