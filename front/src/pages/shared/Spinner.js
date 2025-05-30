import { Col, Row, Spinner } from 'react-bootstrap';

function SpinnerCenter() {
    return <Row className="justify-content-center">
        <Col xs="auto">
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </Col>
    </Row>
}

export default SpinnerCenter;