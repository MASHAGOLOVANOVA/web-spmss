import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'universal-cookie';
import ProjectSidebar from './ProjectSidebar';
import { useParams } from "react-router-dom";
import { Col, Row,  Button, Table, Modal, Form } from 'react-bootstrap';
import SpinnerCenter from 'pages/shared/Spinner';
import { FormatDate } from 'pages/shared/FormatDates';

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

let putMarksReqOptions = {
    method: "PUT",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json",
    },
};

function ProjectStats() {
    const [stats, setStats] = useState(null);
    let { projectId } = useParams();
    const [formData, setFormData] = useState({});
    const [SupRewData, setSupRewData] = useState({});
    const [SupRewCrData, setSupRewCrData] = useState([]);

    const changeButtonRef = useRef(null);
    const changeMessage = useRef(null);

    const [showEditMarks, setShowEditMarks] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}/statistics`, reqOptions)
            .then(response => response.json())
            .then(json => { setStats(json); setSupRewCrData(json["grades"]["supervisor_review"]["criterias"]); setSupRewData(json["grades"]["supervisor_review"]) })
            .catch(error => console.error(error));
    }, []);

    useEffect(() => {
        const element = changeButtonRef.current;
        const mes = changeMessage.current;
        if (element === null) {
            return;
        }
        const weight = SupRewCrData.map((c, i) => {
            return c.weight;
        }).reduce((partialSum, w) => partialSum + parseFloat(w), 0).toFixed(1);
        if (Math.round(weight * 10) / 10 === 1 || SupRewCrData.length === 0) {
            element.disabled = false;
            mes.textContent = "";
            return;
        }
        element.disabled = true;
        mes.textContent = `сумма весов оценок не равна 1 (${weight})!`;
    }, [SupRewCrData]);

    function ShowEditMarks() {
        setShowEditMarks(true)
    }

    function CloseEditMarks() {
        setShowEditMarks(false)
    }

    async function handleSubmit(event) {

        let reqB = {};

        if (formData.defence_grade !== undefined && formData.defence_grade !== "") {
            reqB.defence_grade = parseFloat(formData.defence_grade);
        }

        if (SupRewCrData.length != 0) {
            reqB["supervisor_review"] = {};
            if (SupRewData.created !== undefined) {
                reqB.supervisor_review.created = SupRewData.created.split("T")[0] + "T00:00:00Z";
            }
            else{
                let a = new Date(Date.now()).toISOString();
                reqB.supervisor_review["created"] = a;
            }

            if (SupRewData.id !== undefined) {
                reqB.supervisor_review.id = parseFloat(SupRewData.id);
            }

            reqB.supervisor_review.criterias = SupRewCrData.map(c => {
                c.weight = parseFloat(c.weight);
                if (c.grade === undefined) {
                    return c;
                }
                if (c.grade === "") {
                    delete c.grade;
                    return c;
                }
                c.grade = parseFloat(c.grade);
                return c;
            });
        }


        putMarksReqOptions.body = JSON.stringify(reqB)
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/${projectId}/grades`, putMarksReqOptions)
            const status = response.status;
            console.log("Responce status:", status);
            event.target.reset();
            return

        } catch (error) {
            console.error("Error:", error);
        }
    }

    function RenderSupervisorReview() {
        return <>
            {stats.grades.supervisor_review ?
                <>
                    <div className='fs-5 mb-2'>Отзыв научного руководителя (создан {FormatDate(stats.grades.supervisor_review.created)})</div>
                    {stats.grades.supervisor_review.criterias ?
                        <div>
                            <Table striped bordered hover variant="dark">
                                <thead>
                                    <tr>
                                        <th>Критерий</th>
                                        <th>Оценка</th>
                                        <th>Вес оценки</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.grades.supervisor_review.criterias.map((criteria) =>
                                        <tr>
                                            <td>{criteria.criteria}</td>
                                            <td>{criteria.grade ? criteria.grade : "не выставлена"}</td>
                                            <td>{criteria.weight}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                        : <div className='fs-5 mb-2'>Критерии оценивания отсутствуют</div>
                    }
                </>
                : <div className='fs-5 mb-2'>Отсутствуют</div>
            }
        </>
    }

    function RenderMarksSelect() {

        let marks = []
        for (let i = 1; i < 11; i++) {
            let mark = stats?.grades?.defence_grade ? stats.grades.defence_grade === i ? <option selected value={i}>{i}</option> : <option value={i}>{i}</option> : <option value={i}>{i}</option>
            marks.push(mark)
        }
        return marks
    }

    function RenderMarksSelect(mark) {
        let marks = []
        for (let i = 1; i < 11; i++) {
            let mark1 = mark ? mark === i ? <option selected value={i}>{i}</option> : <option value={i}>{i}</option> : <option value={i}>{i}</option>
            marks.push(mark1)
        }
        return marks
    }

    const handleDefMarkChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(values => ({ ...values, [name]: value }));
        console.log(formData)
    }

    const handleCritChange = (event, cid) => {
        const name = event.target.name;
        const value = event.target.value;
        const newCrit = SupRewCrData.map((c, i) => {
            if (i === cid) {
                c[name] = value;
                return c;
            } else {
                return c;
            }
        });

        setSupRewCrData(newCrit);
        console.log(SupRewCrData)
    }

    const handleCritAdd = (event) => {
        setSupRewCrData([...SupRewCrData, {
            criteria: "",
            weight: 0.1
        }]);
    }
    const handleCritDelete = (event, cid) => {
        setSupRewCrData(SupRewCrData.filter((c, i) => i !== cid));
    }

    function RenderSupervisorReviewForm() {
        return <>
            <>
                <div>
                    <Table striped bordered hover variant="dark" >
                        <thead>
                            <tr>
                                <th>Критерий</th>
                                <th>Оценка</th>
                                <th>Вес оценки</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {SupRewCrData?.map((criteria, i) =>
                                <tr>
                                    <td><Form.Control name="criteria" onChange={(event) => { handleCritChange(event, i) }} placeholder="Введите описание" value={criteria.criteria} /></td>
                                    <td>
                                        <Form.Select name="grade" aria-label="select student" onChange={(event) => { handleCritChange(event, i) }}>
                                            <option value="" selected>-</option>
                                            {RenderMarksSelect(parseInt(criteria.grade))}
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Row>
                                            <Col xs="12" lg="10">
                                                <Form.Range min="0.1" max="1" step="0.1" name="weight" onChange={(event) => { handleCritChange(event, i) }} placeholder="0.1" value={criteria.weight} />
                                            </Col>
                                            <Col xs="12" lg="2">
                                                <Form.Control size='sm' name="weight" onChange={(event) => { handleCritChange(event, i) }} placeholder="0.1" value={criteria.weight} />
                                            </Col>
                                        </Row>
                                    </td>
                                    <td>
                                        <Button className='style-button' onClick={(event) => { handleCritDelete(event, i) }}>–</Button>
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={4}>
                                    <Row>
                                        <Col as={Button} className='style-button mx-3' onClick={handleCritAdd}>+</Col>
                                    </Row>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </>
        </>
    }


    return (
        <>
            <Row className='m-2'>
                <Col xs={12} sm={12} md={4} lg={2}>
                    <ProjectSidebar projectId={projectId} />
                </Col>
                <Col xs={12} sm={12} md={8} lg={10} className='px-5'>
                    {stats ? <>
                        <h3 className='mb-4'>#{projectId} Статистика</h3>
                        <hr />
                        <div>
                            <Row className='mb-3' xs={1} md={2} lg={2}>
                                <Col className='mb-3'>
                                    <div className='fs-3 mb-2 fw-medium'>Встречи</div>
                                    <div className='fs-5 mb-2'>Проведенные встречи: {stats.total_meetings}</div>
                                    <div className='fs-3 mb-2 fw-medium'>Задания</div>
                                    {stats.total_tasks == 0 ?
                                        <div className='fs-5 mb-2'>Заданий нет!</div> :
                                        <>
                                            <div className='fs-5 mb-2'>Всего заданий: {stats.total_tasks}</div>
                                            <div className='fs-5 mb-2'>Выполнено заданий: {stats.tasks_done} ({stats.tasks_done_percent}%)</div>
                                        </>
                                    }
                                </Col>
                                <Col className='mb-3'>
                                    <Row>
                                        <div className='fs-3 mb-2 fw-medium'>
                                            <Row>
                                                <Col>Оценки</Col>
                                                <Col>
                                                    <Button className='style-button' onClick={ShowEditMarks}>Изменить</Button></Col>
                                            </Row> </div>
                                        <div className='fs-4 mb-2 fw-medium'>За защиту: <span className='fs-5 mb-2 fw-normal'>{stats.grades.defence_grade ? stats.grades.defence_grade : "отсутствует"}</span></div>
                                        <div className='fs-4 mb-2 fw-medium'>Научного руководителя: <span className='fs-5 mb-2 fw-normal'>{stats.grades.supervisor_grade ? stats.grades.supervisor_grade : "отсутствует"}</span></div>
                                        {RenderSupervisorReview()}
                                        <div className='fs-4 mb-2 fw-medium'>Итоговая: <span className='fs-5 mb-2 fw-normal'>{stats.grades.final_grade ? stats.grades.final_grade : "отсутствует"}</span></div>
                                        {/* <Row sm={1} lg={1} xl={2}>
                                            <LinkContainer as={Col} to={""}>
                                                <Button className='style-button mb-3'>Составить отзыв руководителя</Button>
                                            </LinkContainer>
                                        </Row> */}
                                    </Row>
                                </Col>
                            </Row>
                        </div>
                    </> : SpinnerCenter()}
                </Col>
            </Row>
            <Modal backdrop="static" show={showEditMarks} onHide={CloseEditMarks} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Изменение оценок</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="" >
                            <Form.Label>Оценка за защиту</Form.Label>
                            <Form.Select name="defence_grade" aria-label="select student" onChange={handleDefMarkChange}>
                                <option value="" selected>нет</option>
                                {RenderMarksSelect(stats?.grades?.defence_grade)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="">
                            <Form.Label>Отзыв руководителя</Form.Label>
                            {RenderSupervisorReviewForm()}
                        </Form.Group>
                        <div ref={changeMessage} className='text-danger'></div>
                    </Modal.Body>
                    <Modal.Footer className='justify-content-center'>
                        <Button ref={changeButtonRef} type="submit" className='style-button' >
                            Изменить
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default ProjectStats;