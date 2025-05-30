import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import ProjectSidebar from './ProjectSidebar';
import { useParams, useNavigate } from "react-router-dom";
import { Col, Row, Button, ListGroup, Modal } from 'react-bootstrap';
import LinkContainer from 'react-router-bootstrap/LinkContainer';
import SpinnerCenter from 'pages/shared/Spinner';
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

let reqOptionsDelete = {
    method: "DELETE",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json",
    }
};

function Project() {
    const [project, setProject] = useState(null);
    const [projectsStatuses, setProjectsStatuses] = useState(null);
    const [projectsStages, setProjectsStages] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    let { projectId } = useParams();
    const navigate = useNavigate();

    function UpdateStatus(event, status) {
        reqOptionsPut.body = JSON.stringify({
            "status": parseInt(status)
        });
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}`, reqOptionsPut)
            .catch(error => console.error(error));
    }

    function UpdateStage(event, stage) {
        reqOptionsPut.body = JSON.stringify({
            "stage": parseInt(stage)
        });
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}`, reqOptionsPut)
            .catch(error => console.error(error));
    }

    const handleDeleteProject = () => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}`, reqOptionsDelete)
            .then(response => {
                if (response.ok) {
                    navigate('/projects'); // Redirect to projects list after deletion
                }
            })
            .catch(error => console.error(error));
    };

    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/` + projectId, reqOptions)
            .then(response => response.json())
            .then(json => setProject(json))
            .catch(error => console.error(error));
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/statuslist`, reqOptions)
            .then(response => response.json())
            .then(json => setProjectsStatuses(json["statuses"]))
            .catch(error => console.error(error));
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/stagelist`, reqOptions)
            .then(response => response.json())
            .then(json => setProjectsStages(json["stages"]))
            .catch(error => console.error(error));
    }, []);

    const formatStatus = (status) => {
        switch(status) {
            case "InProgress": return "В работе";
            case "Completed": return "Завершён";
            case "Archived": return "В архиве";
            default: return status;
        }
    };

    const formatStage = (stage) => {
        switch(stage) {
            case "Analysis": return "Анализ";
            case "Design": return "Проектирование";
            case "Development": return "Разработка";
            case "Testing": return "Тестирование";
            case "Deployment": return "Внедрение";
            default: return stage;
        }
    };

    return (
        <>
            <Row className='m-2'>
                <Col xs={12} sm={12} md={4} lg={2}>
                    <ProjectSidebar projectId={projectId} />
                </Col>
                <Col xs={12} sm={12} md={8} lg={10} className='px-5'>
                    {project ? <>
                        <h3 className='mb-4'>#{project.id} {project.theme}</h3>
                        <hr />
                        <div>
                            <Row className='mb-3'>
                                <Col md="auto">
                                    Статус: <StatusSelect func={UpdateStatus} items={projectsStatuses} status={project.status} />
                                    
                                </Col>
                                <Col md="auto">
                                    Стадия: <StatusSelect func={UpdateStage} items={projectsStages} status={project.stage} />
                                    
                                </Col>
                                <Col md="auto">
                                    Год: {project.year}
                                </Col>
                            </Row>
                            <Row className='mb-3' xs={1} md={2} lg={2}>
                                <Col className='mb-3'>
                                    <div className='fs-3 mb-2 fw-medium'>Студенты</div>
                                    <ListGroup variant="flush">
        {project.students.map((student, index) => (
            <ListGroup.Item key={index} className="py-1 px-0 small">
                {student.surname} {student.name} {student.middlename}, {student.cource} курс
                {student.education_programme && `, ${student.education_programme}`}
            </ListGroup.Item>
        ))}
    </ListGroup>
                                </Col>
                                <Col className='mb-3'>
                                    <Row>
                                        <div className='fs-3 mb-2 fw-medium'>Действия</div>
                                        <Row sm={1} lg={1} xl={3}>
                                            <LinkContainer as={Col} to={"./tasks/add"}>
                                                <Button className='style-button mb-3'>Назначить задание</Button>
                                            </LinkContainer>
                                        </Row>
                                        <Row sm={1} lg={1} xl={3}>
                                            {!project.cloud_folder_link ?
                                                <Button variant="outline-warning" className='mb-3' disabled>Проекта нет в облачном хранилище</Button>
                                                : <Button as="a" href={project.cloud_folder_link} target="_blank" rel="noopener noreferrer" className='style-button mb-3'>Открыть папку проекта</Button>
                                            }
                                        </Row>
                                        <Row sm={1} lg={1} xl={3}>
                                            <Button 
                                                variant="danger" 
                                                className='mb-3' 
                                                onClick={() => setShowDeleteModal(true)}
                                            >
                                                Удалить проект
                                            </Button>
                                        </Row>
                                    </Row>
                                </Col>
                            </Row>
                        </div>
                        {/* Delete Confirmation Modal */}
                        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Подтверждение удаления</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                Вы уверены, что хотите удалить проект "{project.theme}"? Это действие нельзя отменить.
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="danger" onClick={handleDeleteProject}>
                                    Удалить
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </> : <SpinnerCenter />}
                </Col>
            </Row>
        </>
    );
};

export default Project;