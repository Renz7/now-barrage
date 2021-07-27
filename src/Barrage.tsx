import React, {Component} from 'react';
import {Alert, Button, FormControl, InputGroup} from "react-bootstrap";
import {ipcRenderer} from "electron";

class Barrage extends Component<any, any> {
  constructor(prop: any) {
    super(prop);
    this.state = {
      roomId: "",
      barrage: 0
    }
  }

  render() {
    return (
      <div className={"Barrage"} hidden={!this.props.show}>
        <Alert className={"Alert"}>发送弹幕</Alert>
        <InputGroup className={"mb-3"}>
          <FormControl
            placeholder="直播间号"
            aria-label="roomId"
            aria-describedby="basic-addon1"
            onChange={(event) => {
              this.setState({"roomId": event.target.value, "barrage": this.state.barrage})
            }}
          />
        </InputGroup>
        <InputGroup className={"mb-3"}>
          <FormControl
            placeholder="弹幕内容..."
            aria-label="barrage"
            aria-describedby="basic-addon1"
            onChange={(event) => {
              this.setState({"barrage": event.target.value, "roomId": this.state.roomId})
            }}
          />
        </InputGroup>
        <Button className={"Button"} onClick={() => {
          console.log("send barrage")
          console.log(ipcRenderer.sendSync("barrage", this.state));
        }
        }>
          发送
        </Button>
      </div>
    );
  }

}


export default Barrage;
