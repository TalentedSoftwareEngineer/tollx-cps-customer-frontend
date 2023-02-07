import React from 'react';
import Config from '../Config';

const isProd = process.env.NODE_ENV === 'production';
const Image = ({src, ...props}) => {
  const correctSRC = (isProd && src.startsWith("/")) ? Config.basePath + src : src;
  return (
    <img src={correctSRC} {...props} />
  );
};

export default React.memo(Image);
