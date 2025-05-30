import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import ProjectSidebar from '../ProjectSidebar';
import { Col, Row } from 'react-bootstrap';
import { Container, Card, Badge, Button, Accordion, Spinner } from 'react-bootstrap';
import LinkContainer from 'react-router-bootstrap/LinkContainer';
import { Link } from "react-router-dom";

import { useParams } from "react-router-dom";
import { FormatDateTime } from 'pages/shared/FormatDates';
import StatusSelect from 'pages/shared/status/StatusSelect';

const cookies = new Cookies();
const reqOptions = {
  method: "GET",
  mode: "cors",
  cache: "default",
  credentials: 'include',
  headers: {
    "Session-Id": cookies.get('session_token')
  }
};

let reqOptionsPut = {
  method: "PUT",
  mode: "cors",
  cache: "default",
  credentials: 'include',
  headers: {
      "Session-Id": cookies.get('session_token'),
      "Content-Type": "application/json",
  }
};

function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [tasksStatuses, setTasksStatuses] = useState(null);
  let { projectId } = useParams();

  useEffect(() => {
    const currentTime = new Date(Date.now());
    currentTime.setDate(currentTime.getDate() - 30)
    fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}/tasks`, reqOptions)
      .then(response => response.json())
      .then(json => setTasks(json["tasks"]))
      .catch(error => console.error(error));
    fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/tasks/statuslist`, reqOptions)
      .then(response => response.json())
      .then(json => setTasksStatuses(json["statuses"]))
      .catch(error => console.error(error));
  }, []);

  function UpdateStatus(event, status, taskId) {
    reqOptionsPut.body = JSON.stringify({
      "status": parseInt(status)
    });
    fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}/tasks/${taskId}`, reqOptionsPut)
      .catch(error => console.error(error));
  }

  function renderTasks() {
    if (tasks.length === 0) {
      return (
        <Col>
          Заданий нет!
        </Col>
      )
    }
    return <Row xs={1} sm={1} md={2} xl={4}>
      {
        tasks.map((task) =>
          <Col>
            <Card className="mb-4 style-outline">
              <Card.Header>#{task.id} <StatusSelect id={task.id} func={UpdateStatus} items={tasksStatuses} selectClass="style-select-in-badge-sm" status={task.status} /></Card.Header>
              <Card.Body>
                <Card.Title className='mb-3'>
                  <LinkContainer to={"./" + task.id}>
                    <Link className="link-body-emphasis link-offset-2 link-underline-opacity-0 link-underline-opacity-50-hover">{task.name}</Link>
                  </LinkContainer>
                </Card.Title>
                <Card.Subtitle className="mb-2">
                  до: {FormatDateTime(task.deadline)}
                </Card.Subtitle>
                <Card.Text className="text-muted">
                  {task.cloud_folder_link === "" ?
                    <Button variant="outline-warning" className='mb-3' disabled>Задания нет в облачном хранилище</Button>
                    : <Button as="a" href={task.cloud_folder_link} target="_blank" rel="noopener noreferrer" className='style-button-outline mb-3'>Открыть папку с заданием</Button>
                  }
                  {task.description === "" ? <></> :
                    <Accordion>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header className='style-accordion'> Описание...</Accordion.Header>
                        <Accordion.Body>
                          {task.description}
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )
      }
    </Row>
  }

  return (
    <>
      <Row className='m-2'>
        <Col xs={12} sm={12} md={4} xl={2}>
          <ProjectSidebar projectId={projectId} />
        </Col>
        <Col xs={12} sm={12} md={8} xl={10} className='px-5'>
          <h3>Задания проекта #{projectId}</h3>
          <hr />
          <LinkContainer to={"./add"}>
            <Button className='style-button mb-3'>Назначить задание</Button>
          </LinkContainer>
          {tasks ? renderTasks() :
            <Row className="justify-content-md-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </Row>}
        </Col>
      </Row>
    </>
  );
};

export default Tasks;