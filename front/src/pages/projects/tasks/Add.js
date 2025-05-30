import React, { useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import Cookies from 'universal-cookie';
import { Container, Row, Card, Badge, Button, Col, Alert, Form, Modal, Spinner } from 'react-bootstrap';
import LinkContainer from 'react-router-bootstrap/LinkContainer';
import { Link } from 'react-router-dom';
import SpinnerCenter from 'pages/shared/Spinner';
import ProjectSidebar from '../ProjectSidebar';

const cookies = new Cookies();

const getReqOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token')
    }
};

let postMeetingReqOptions = {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json",
    },
};

function AddTask() {
    const [formData, setFormData] = useState({});
    const [showAddTaskResult, setShowAddMeetingResult] = useState(false);
    const [addTaskResult, setAddMeetingResult] = useState(null);

    let { projectId } = useParams();
    const [integr, setIntegr] = useState(null);

    useEffect(() => {
        // setting task defaults
        setFormData({
            "name": "",
            "description": "",
            "deadline": ""
        });
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/account/integrations`, getReqOptions)
            .then(response => response.json())
            .then(json => {
                setIntegr(json);
            });
    }, []);


    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(values => ({ ...values, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        event.target.reset();
        prepareReqBody();
        OpenRequestResultModal()
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}/tasks/add`, postMeetingReqOptions)
            const status = response.status;
            console.log("Responce status:", status);
            setAddMeetingResult(status)
        } catch (error) {
            console.error("Error:", error);
        }
    }

    function prepareReqBody() {
        formData["deadline"] += ":00.000Z";
        postMeetingReqOptions["body"] = JSON.stringify(formData)
    }


    function OpenRequestResultModal() {
        setShowAddMeetingResult(true);
    }
    function CloseRequestResultModal() {
        setShowAddMeetingResult(false);
        setAddMeetingResult(null);
    }

    function RenderRequestResultModal() {
        let header = "Задание назначено!";
        let body = "Вы можете просмотреть его в заданиях проекта.";
        if (addTaskResult != 200) {
            header = "Произошла ошибка при назанчении задания!";
            body = `Код ошибки: ${addTaskResult}. Обратитесь в службу поддержки, если прблема не устранится.`;
        }
        return <>
            <Modal.Header>
                <Modal.Title>{header}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer>
                <Button className='style-button' onClick={CloseRequestResultModal}>
                    ОК
                </Button>
            </Modal.Footer>
        </>
    }

    return (
        <>
            <Row className='m-2'>
                <Col Col xs={12} sm={12} md={4} xl={2}>
                    <ProjectSidebar projectId={projectId} />
                </Col>
                <Col xs={12} sm={12} md={8} xl={10} className='px-5'>
                    <Row className='justify-content-center'>
                        <h3 className='mb-4'>Назначить задание</h3>
                        <hr />
                        <div >

                            {integr ?
                                integr.cloud_drive ?
                                    <Row className='justify-content-start'>
                                        <Col xs={12} sm={8}>
                                            <Form onSubmit={handleSubmit}>
                                                <Form.Group className="mb-3" controlId="meetName">
                                                    <Form.Label>Название *</Form.Label>
                                                    <Form.Control name="name" onChange={handleChange} required placeholder="Введите название" />
                                                    <Form.Text className="text-muted">
                                                        Будьте кратки в названии
                                                    </Form.Text>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="meetDesc">
                                                    <Form.Label>Описание</Form.Label>
                                                    <Form.Control as="textarea" rows={5} name="description" onChange={handleChange} placeholder="Введите описание" />
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="meetTime">
                                                    <Form.Label>Деделайн *</Form.Label>
                                                    <Form.Control name="deadline" onChange={handleChange} required type="datetime-local"
                                                        id="meeting-time"
                                                        min={new Date(Date.now()).toISOString().split(":")[0] + ":" + new Date(Date.now()).toISOString().split(":")[1]}
                                                    />
                                                </Form.Group>

                                                <Button type="submit" className="style-button">
                                                    Назначить
                                                </Button>
                                            </Form>
                                        </Col>
                                    </Row>
                                    :
                                    <>
                                        <h3>Вы еще не подключили облачное хранилище, это можно сделать <a href='/profile'>здесь</a></h3>
                                    </>
                                : SpinnerCenter()}

                        </div>
                    </Row>
                </Col>
            </Row>
            <Modal show={showAddTaskResult} onHide={CloseRequestResultModal}>
                {addTaskResult ? RenderRequestResultModal() :
                    <Modal.Header className="justify-content-md-center">
                        {SpinnerCenter()}
                    </Modal.Header>}
            </Modal>
        </>
    );
};

export default AddTask;