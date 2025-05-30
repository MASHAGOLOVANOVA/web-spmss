import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import { Row, Card, Badge, Col, ListGroup } from 'react-bootstrap';
import LinkContainer from 'react-router-bootstrap/LinkContainer';
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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

function Projects() {
    const [projects, setProjects] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [projectsStatuses, setProjectsStatuses] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects?filter=${searchParams.get("filter")}`, reqOptions)
            .then(response => response.json())
            .then(json => setProjects(json["projects"]))
            .catch(error => console.error(error));
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/statuslist`, reqOptions)
            .then(response => response.json())
            .then(json => setProjectsStatuses(json["statuses"]))
            .catch(error => console.error(error));
    }, []);

    function UpdateStatus(event, status) {
        let filter = projectsStatuses.find((el) => el.value === parseInt(status)).name
        navigate(`/projects?filter=${filter}`, { replace: true });
        window.location.reload();
    }

    return (
        <>
            <Row className='justify-content-center'>
                <Col xs={11} md={10} lg={8}>
                    <h1>Проекты</h1>
                    <hr />
                    <div>
                        <span className='fs-5 fw-light'>Фильтры</span>
                        <span className='style-vert-line'></span>
                        <span className='fs-5 fw-light'>статус проекта</span>
                        <StatusSelect selectClass="style-select-in-badge-sm" func={UpdateStatus} items={projectsStatuses} status={searchParams.get("filter")} />
                    </div>

                    <hr />
                    <div>
                        {projects ?
                            projects.length !== 0 ?
                                <>
                                    <div className='mb-2'>найдено результатов: {projects.length}</div>
                                    {projects.map((project) =>
                                        <Card className="mb-4 style-outline" key={project.id}>
                                            <Card.Header>#{project.id} <Badge pill className='style-bg'>{project.status}</Badge> <Badge pill className='style-bg'>{project.stage}</Badge></Card.Header>
                                            <Card.Body>
                                                <Card.Title className='mb-4'>
                                                    <LinkContainer to={"./" + project.id}>
                                                        <Link className="link-body-emphasis link-offset-2 link-underline-opacity-0 link-underline-opacity-50-hover">{project.theme}</Link>
                                                    </LinkContainer>
                                                </Card.Title>
                                                <Card.Subtitle className="mb-2 text-muted">
                                                    {project.year}
                                                </Card.Subtitle>
                                                <Card.Text>
                                                    <ListGroup variant="flush">
                                                        {project.students.map((student, index) => (
                                                            <ListGroup.Item key={index}>
                                                                {student.student_name}, {student.student_course} курс, {student.student_ed_program}, {student.student_university}
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                </Card.Text>
                                            </Card.Body>
                                        </Card>
                                    )}
                                </> : <Col>
                                    Проектов нет!
                                </Col>
                            : SpinnerCenter()
                        }
                    </div>
                </Col>
            </Row>
        </>
    );
};

export default Projects;