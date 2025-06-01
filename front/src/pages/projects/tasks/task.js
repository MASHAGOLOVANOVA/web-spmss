import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import ProjectSidebar from 'pages/projects/ProjectSidebar';
import { useParams } from "react-router-dom";
import { Col, Row, Badge, Container } from 'react-bootstrap';
import SpinnerCenter from 'pages/shared/Spinner';

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

function Task() {
    const [task, setTask] = useState(null);
    let { projectId, taskId } = useParams();


    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/` + projectId + '/tasks/' + taskId, reqOptions)
            .then(response => response.json())
            .then(json => setTask(json))
            .catch(error => console.error(error));
    }, []);
    return (
        <>
            <Row className='m-2'>
                <Col xs={12} sm={12} md={4} xl={2}>
                    <ProjectSidebar projectId={projectId} />
                </Col>
                <Col xs={12} sm={12} md={8} xl={10} className='px-5'>
                    {task ? <>
                        <h3 className='mb-4'>#{projectId} {task.theme}</h3>
                        <hr />
                        <div>
                            <Row className='mb-3'>
                                <Col md="auto">
                                    Статус: <Badge pill bg="info" className='mx-2 style-bg'>{task.status}</Badge>
                                </Col>
                                <Col md="auto">
                                    Стадия: <Badge pill bg="info" className='mx-2 style-bg'>{task.stage}</Badge>
                                </Col>
                            </Row>
                            <Row className='mb-3'>
                                <Col>
                                    <div className='fs-3 mb-2 fw-medium'>Студент</div>
                                    <div className='fs-4 mb-2'>{task.student.surname} {task.student.name} {task.student.middlename}, {task.student.cource} курс</div>
                                    <div className='fs-5 mb-2'>Образовательная программа: <span className='fst-italic'>{task.student.education_programme}</span></div>
                                </Col>
                                <Col>
                                    <div>Открыть папку проекта</div>
                                </Col>
                            </Row>
                        </div>
                    </> : SpinnerCenter()}
                </Col>
            </Row>
        </>
    );
};

export default Task;