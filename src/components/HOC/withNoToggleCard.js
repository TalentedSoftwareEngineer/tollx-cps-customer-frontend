import React from 'react'
import {cardHeader} from "../Card/CollapsibleCardHeader";
import {Card, Collapse} from "reactstrap";
import { CardBody } from "reactstrap";

const Header = cardHeader(true, false);

export default function withNoToggleCard(title, WrappedComponent){
  return class extends React.Component {
    constructor(props) {
      super(props);
    }

    render(){
      return (
        <Card>
          <Header>{title}</Header>
          <Collapse isOpen={true}>
            <CardBody>
              <WrappedComponent {...this.props}/>
            </CardBody>
          </Collapse>
        </Card>
      )
    }
  }
}
