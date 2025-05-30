import { Row, Button, Col, Form, Modal, ListGroup, Card } from 'react-bootstrap';
import Cookies from 'universal-cookie';
import React, { useState, useEffect, useRef } from 'react';
import SpinnerCenter from 'pages/shared/Spinner';

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

let postReqOptions = {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json",
    },
};

function AddProject() {
    const [students, setStudents] = useState(null);
    const [edprogs, setEdprogs] = useState(null);
    const [formData, setFormData] = useState({});
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showAddProjectResult, setShowAddProjectResult] = useState(false);
    const [addProjectResult, setAddProjectResult] = useState(null);
    const [integr, setIntegr] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setFormData({
            "theme": "",
            "student_ids": [],
            "year": new Date().getFullYear(),
            "repository_owner_login": "",
            "repository_name": ""
        });

        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/account/integrations`, getReqOptions)
            .then(response => response.json())
            .then(json => {
                setIntegr(json);
                if (json.cloud_drive) {
                    fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/applications/professor`, getReqOptions)
                        .then(response => response.json())
                        .then(json => {
                            console.log('Students data:', json.applications);
                            setStudents(json.applications || []);
                        })
                        .catch(error => {
                            console.error(error);
                            setStudents([]);
                        });
                    
                }
            })
            .catch(error => {
                console.error(error);
                setIntegr({});
            });
    }, []);

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(values => ({ ...values, [name]: value }));
    }

    const handleStudentCheckboxChange = (studentId) => {
        setSelectedStudents(prev => {
            const newSelection = prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId];
            
            setFormData(values => ({ ...values, student_ids: newSelection }));
            return newSelection;
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        OpenRequestResultModal();
        try {
            prepareProjectReqBody();
            const response = await fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/add`, postReqOptions);
            const status = response.status;
            console.log("Response status:", status);
            setAddProjectResult(status);
        } catch (error) {
            console.error("Error:", error);
            setAddProjectResult(500);
        }
    }

    function prepareProjectReqBody() {
        const data = {
            ...formData,
            student_ids: selectedStudents,
            year: parseInt(formData["year"])
        };
        postReqOptions["body"] = JSON.stringify(data);
        console.log(data)
    }

    function RenderStudentCheckboxes({ searchTerm, setSearchTerm, students, selectedStudents, handleStudentCheckboxChange }) {
        const activeStudents = students
            .filter(student => student.status === "true")
            .reduce((unique, student) => {
                if (!unique.some(item => item.student_id === student.student_id)) {
                    unique.push(student);
                }
                return unique;
            }, []);
    
        const filteredStudents = activeStudents.filter(student =>
            student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_ed_prog.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_course.toString().includes(searchTerm)
        );
    
        if (activeStudents.length === 0) {
            return (
                <div className="alert alert-info">
                    Нет доступных студентов для выбора
                </div>
            );
        }
    
        return (
            <Card className="mb-3">
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Поиск студентов..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Group>
                    
                    <ListGroup style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <ListGroup.Item key={student.student_id}>
                                    <Form.Check 
                                        type="checkbox"
                                        id={`student-${student.student_id}`}
                                        label={<span style={{ fontSize: '1.2rem' }}>{student.student_name}, {student.student_course} курс,  {student.student_ed_prog}</span>}
                                        checked={selectedStudents.includes(student.student_id)}
                                        onChange={() => handleStudentCheckboxChange(student.student_id)}
                                    />
                                </ListGroup.Item>
                            ))
                        ) : (
                            <ListGroup.Item className="text-center text-muted">
                                Студенты не найдены
                            </ListGroup.Item>
                        )}
                    </ListGroup>
                </Card.Body>
            </Card>
        );
    }


    function OpenRequestResultModal() {
        setShowAddProjectResult(true);
    }

    function CloseRequestResultModal() {
        setShowAddProjectResult(false);
        setAddProjectResult(null);
    }

    function RenderRequestResultModal() {
        let header = "Научное руководство оформлено!";
        let body = "Вы можете просмотреть проект в списке проектов.";
    
        if (addProjectResult !== 200) {
            header = "Произошла ошибка при оформлении научного руководства!";
            body = `Код ошибки: ${addProjectResult}. Обратитесь в службу поддержки, если проблема не устранится.`;
        }
    
        return (
            <>
                <Modal.Header closeButton>
                    <Modal.Title>{header}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <Button className='style-button' onClick={CloseRequestResultModal}>
                        ОК
                    </Button>
                </Modal.Footer>
            </>
        );
    }

    return (
        <>
            <Row className='justify-content-center'>
                <Col xs={11} md={10} lg={8}>
                    <h1 className='mb-4'>Добавить проект</h1>
                    <hr />
                    {integr ? (
                        integr.cloud_drive ? (
                            <div>
                                {students ? (
                                    students.filter(student => student.status === "true").length > 0 ? (
                                        <>
                                            <div className='fs-3 mb-4'>
                                                Выберите участников проекта:
                                                {RenderStudentCheckboxes({
                                                    searchTerm,
                                                    setSearchTerm,
                                                    students,
                                                    selectedStudents,
                                                    handleStudentCheckboxChange
                                                })}
                                            </div>
    
                                            <div className='fs-3'>
                                                Введите информацию о проекте:
                                                <Form id="project-form" onSubmit={handleSubmit}>
                                                    <Form.Group className="mb-3" controlId="theme">
                                                        <Form.Label>Тема работы *</Form.Label>
                                                        <Form.Control 
                                                            name="theme" 
                                                            value={formData.theme}
                                                            onChange={handleChange} 
                                                            required 
                                                            placeholder="Введите тему проекта" 
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3" controlId="year">
                                                        <Form.Label>Год выполнения *</Form.Label>
                                                        <Form.Control 
                                                            type='number' 
                                                            name="year" 
                                                            value={formData.year}
                                                            onChange={handleChange} 
                                                            required 
                                                            placeholder="Введите год выполнения" 
                                                            min="2000"
                                                            max="2100"
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3" controlId="repository_owner_login">
                                                        <Form.Label>Логин владельца репозитория *</Form.Label>
                                                        <Form.Control 
                                                            name="repository_owner_login" 
                                                            value={formData.repository_owner_login}
                                                            onChange={handleChange} 
                                                            required 
                                                            placeholder="Введите логин (например, ваш GitHub username)" 
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3" controlId="repository_name">
                                                        <Form.Label>Название репозитория *</Form.Label>
                                                        <Form.Control 
                                                            name="repository_name" 
                                                            value={formData.repository_name}
                                                            onChange={handleChange} 
                                                            required 
                                                            placeholder="Введите название репозитория" 
                                                        />
                                                    </Form.Group>

                                                    <Row className='justify-content-center mx-1'>
                                                        <Button 
                                                            type="submit" 
                                                            className="style-button mb-3"
                                                            disabled={selectedStudents.length === 0}
                                                        >
                                                            Взять под научное руководство
                                                        </Button>
                                                    </Row>
                                                </Form>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="alert alert-info">
                                            В настоящее время нет доступных студентов для научного руководства.
                                            Вы не можете добавить проект, пока нет активных студентов.
                                        </div>
                                    )
                                ) : (
                                    SpinnerCenter()
                                )}
                            </div>
                        ) : (
                            <>
                                <h3>Вы еще не подключили облачное хранилище, это можно сделать <a href='/profile'>здесь</a></h3>
                            </>
                        )
                    ) : (
                        SpinnerCenter()
                    )}
                </Col>
            </Row>

            <Modal show={showAddProjectResult} onHide={CloseRequestResultModal}>
                {addProjectResult ? (
                    RenderRequestResultModal()
                ) : (
                    <Modal.Header className="justify-content-md-center">
                        {SpinnerCenter()}
                    </Modal.Header>
                )}
            </Modal>
        </>
    );
}

export default AddProject;