import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'universal-cookie';
import { Button,  Form } from 'react-bootstrap';

import SpinnerCenter from 'pages/shared/Spinner';
import { useNavigate } from "react-router-dom";

const cookies = new Cookies();

const getPlanners = `${process.env.REACT_APP_SERVER_ADDR}/api/v1/auth/integration/getplanners`;
const setPlannersLink = `${process.env.REACT_APP_SERVER_ADDR}/api/v1/auth/integration/setplanner`;

const reqGetOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token')
    }
};

const reqPostOptions = {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json",
    }
};

function SetCalendar() {
    const [formData, setFormData] = useState({});
    const [planners, setPlanners] = useState(null);
    const navigate = useNavigate();

    const selectRef = useRef(null);

    useEffect(() => {
        fetch(`${getPlanners}`, reqGetOptions)
            .then(response => response.json())
            .then(json => setPlanners(json["planners"]))
            .catch(error => console.error(error));
        resetSelect();
    }, []);

    function resetSelect() {
        // set select as invalid, so student has to be chosen
        const element = selectRef.current;
        element.setCustomValidity("Выберите студента!");
    }

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(values => ({ ...values, [name]: value }));
    }

    const handleSelectChange = (event) => {
        // you cannot select default option anymore, so we can just make it valid
        event.target.setCustomValidity("");
        handleChange(event);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        event.target.reset();
        reqPostOptions["body"] = JSON.stringify(formData)
        try {
            const response = await fetch(`${setPlannersLink}`, reqPostOptions)
            const status = response.status;
            console.log("Responce status:", status);
            navigate("/profile");
        } catch (error) {
            console.error("Error:", error);
        }
    }

    function RenderPlanners() {
        return planners.map((planner) =>
            <option value={`${planner.id}`}>
                {`${planner.name}`}
            </option>)
    }

    return <>
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="student">
                <Form.Label>Какой планнер использовать для ведения расписания? *</Form.Label>
                <Form.Select ref={selectRef} name="planner_id" onChange={handleSelectChange} required aria-label="select" >
                    <option value={-1} selected hidden>Выберите планнер...</option>
                    {planners ? RenderPlanners() :
                        <option disabled>{SpinnerCenter()}</option>
                    }
                </Form.Select>
            </Form.Group>
            <Button type="submit" className="style-button">
                Назначить
            </Button>
        </Form>
    </>
};

export default SetCalendar;