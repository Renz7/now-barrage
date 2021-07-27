import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import './App.global.css';
import now from '../assets/now.png'

import {Container, Nav, Navbar} from 'react-bootstrap';
import {ipcRenderer} from "electron";
import Accounts from "./Accounts";
import Barrage from "./Barrage";


/**
 * main page
 */
class Page extends Component<any, any> {

  constructor(props: any) {
    super(props);
    this.state = {
      accountsShow: true,
      barrageShow: false,
      data: undefined
    }
  }

  setAccountShow = () => {
    ipcRenderer.send("accounts")
    console.log("send")
    ipcRenderer.on("accounts-reply", (_, data) => {
      console.log(typeof data)
      this.setState({accountsShow: true, barrageShow: false, data: JSON.parse(data)})
    })
  }

  setBarrageShow = () => {
    this.setState({accountsShow: false, barrageShow: true})
  }

  render() {
    return (
      <div className={"APP"}>
        {/*header menu*/}
        <Navbar bg="black" expand="lg" className="Menu" fixed="top" collapseOnSelect={true}>
          <Navbar.Brand><span><img src={now}/></span></Navbar.Brand>
          <Navbar.Collapse className={"Collapse"}>
            <Container className="Menu-nav">
              <Nav.Link className="Nav" onClick={() => {
                ipcRenderer.send("login", "qq");
              }}>登录</Nav.Link>
              <Nav.Link className="Nav" onClick={this.setAccountShow}>查看所有</Nav.Link>
              <Nav.Link className="Nav" onClick={this.setBarrageShow}>房间抽奖</Nav.Link>
            </Container>
          </Navbar.Collapse>
        </Navbar>
        {/*page*/}
        <Accounts show={this.state.accountsShow} data={this.state.data}/>
        <Barrage show={this.state.barrageShow}/>
      </div>
    );
  }
}


export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Page}/>
      </Switch>
    </Router>
  );
}
