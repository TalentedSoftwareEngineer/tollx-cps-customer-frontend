import React, { Component }  from 'react';
import * as gConst from "../../constants/GlobalConstants";

const ProgressBar = (props) => {
  const { bgcolor, completed, status } = props;

  const containerStyles = {
    height: 24,
    width: '100%',
    backgroundColor: "#A0A09E",
    borderRadius: 50,
    position: 'relative'
    // margin: 50
  }

  const fillerStyles = {
    height: '100%',
    width: `${completed}%`,
    backgroundColor: (status !== gConst.AUTO_RESULT_FAILED) ? '#00A05C' : '#EF6C00',
    borderRadius: 'inherit',
    // transision: 'width 1s ease-in-out',
    textAlign: 'center',
    position: 'relative'
  }

  const labelStyles = {
    // marginBottom: '15px',
    // marginBottom:5,
    marginTop: '3px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    position: 'absolute',
    width: '100%',
    right: 0,
    zIndex: 50
  }

  return (
    <div style={containerStyles}>
      <span style={labelStyles}>{status === gConst.AUTO_RESULT_FAILED ? `${completed}%` + status : `${completed}%`} {status === gConst.AUTO_RESULT_INPROGRESS && completed < 100 ? <i className="fa fa-spinner fa-spin"/> : ''} </span>
      <div style={fillerStyles}/>

    </div>
  );
};

export default ProgressBar;
