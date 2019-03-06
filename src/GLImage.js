import GL from 'gl-react';
import React from 'react';
import rectCrop from 'rect-crop';
import rectClamp from 'rect-clamp';
import PropTypes from 'prop-types';

const shaders = GL.Shaders.create({
  image: {
    frag: `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D t;
    uniform vec4 crop;
    vec2 invert (vec2 p) {
      return vec2(p.x, 1.0-p.y);
    }
    void main () {
      vec2 p = invert(invert(uv) * crop.zw + crop.xy);
      gl_FragColor =
      step(0.0, p.x) *
      step(0.0, p.y) *
      step(p.x, 1.0) *
      step(p.y, 1.0) *
      texture2D(t, p);
    }`,
  },
});

const GLImage = GL.createComponent(({
  width,
  height,
  source,
  imageSize,
  center,
  zoom,
}) => {
  let imageSizeValue = imageSize;
  let centerValue = center;
  let zoomValue = zoom;
  if (!imageSizeValue) {
    if (source.width && source.height) {
      imageSizeValue = { width: source.width, height: source.height };
    } else {
      throw new Error("gl-rect-image: imageSizeValue is required if you don't provide {width,height} in source");
    }
  }

  if (!center) centerValue = [0.5, 0.5];
  if (!zoomValue) zoomValue = 1;
  let rect = rectCrop(zoomValue, centerValue)({ width, height }, imageSizeValue);
  rect = rectClamp(rect, [0, 0, imageSizeValue.width, imageSizeValue.height]);
  const crop = [
    rect[0] / imageSizeValue.width,
    rect[1] / imageSizeValue.height,
    rect[2] / imageSizeValue.width,
    rect[3] / imageSizeValue.height,
  ];

  return (
    <GL.Node
      shader={shaders.image}
      uniforms={{ t: source, crop }}
    />
  );
}, {
  displayName: 'GLImage',
  propTypes: {
    source: PropTypes.any.isRequired,
    imageSizeValue: PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
    }),
  },
});

export default GLImage;
