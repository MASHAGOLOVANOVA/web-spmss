import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import ProjectSidebar from './ProjectSidebar';
import SpinnerCenter from 'pages/shared/Spinner';
import {FormatDateTime} from 'pages/shared/FormatDates';
import { Col, Row} from 'react-bootstrap';


import { useParams } from "react-router-dom";

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

function Commits() {
    const [commits, setCommits] = useState(null);
    let { projectId } = useParams();

    useEffect(() => {
        const currentTime = new Date(Date.now());
        currentTime.setDate(currentTime.getDate() - 30)
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects/` + projectId + "/commits?" + new URLSearchParams({
            from: currentTime.toISOString(),
        }), reqOptions)
            .then(response => response.json())
            .then(json => setCommits(json["commits"]))
            .catch(error => console.error(error));
    }, []);

    function renderCommits() {
        if (commits.length === 0) {
            return (
                <Col>
                    Коммитов нет!
                </Col>
            )
        }
        return commits.map((commit) =>
            <Row as="li" className="d-flex justify-content-between align-items-start">
                <Col xs={12} sm={12} md={3} lg={2} xxl="auto" className='fst-italic text-secondary'>
                    {FormatDateTime(commit.date_created)}
                </Col>
                <Col className='mb-3 text-break'>
                    <h5>
                        {commit.message}
                    </h5>
                    <div className='text-secondary-emphasis'>
                        Автор: {commit.created_by}
                    </div>
                </Col>
                <hr />
            </Row>
        )
    }

    return (
        <>
            <Row className='m-2'>
                <Col Col xs={12} sm={12} md={4} xl={2}>
                    <ProjectSidebar projectId={projectId} />
                </Col>
                <Col xs={12} sm={12} md={8} xl={10} className='px-5'>
                    <h3 className='mb-4'>Коммиты проекта #{projectId} за последние 30 дней</h3>
                    <hr />
                    {commits ? renderCommits() : SpinnerCenter()}
                </Col>
            </Row>
        </>
    );
};

export default Commits;