import React from 'react';
import {Table} from "react-bootstrap";
import {DbRow} from "./core/interfaces";

const Accounts = ({show: show, data: data}: { show: boolean, data: DbRow[] }) => {
  console.log(data)
  let rows = [];
  if (data && data.length > 0) {
    let c = 0;
    for (const rowData of data) {
      c += 1;
      let type: string = rowData.user_type == "0" ? "QQ" : "WX"
      rows.push(
        <tr>
          <td>{c}</td>
          <td><img src={rowData.logo_full_url} className={"userLogo"}/></td>
          <td>{rowData.explicit_uid}</td>
          <td>{rowData.id}</td>
          <td>{type}</td>
        </tr>
      )
    }
  } else {
    rows.push(<tr>
        <td>1</td>
        <td colSpan={4} align={"center"}>暂无数据</td>
      </tr>
    )
  }

  return (
    <Table striped bordered hover className={"Accounts"} hidden={!show}>
      <thead>
      <tr>
        <th>#</th>
        <th>头像</th>
        <th>id号</th>
        <th>QQ</th>
        <th>登录方式</th>
      </tr>
      </thead>
      <tbody>
      {rows}
      </tbody>
    </Table>
  )
}

export default Accounts;
