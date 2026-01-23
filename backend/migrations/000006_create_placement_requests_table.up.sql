CREATE TABLE placement_requests (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    patient_age INTEGER NOT NULL,
    patient_gender VARCHAR(20) NOT NULL,
    medical_condition TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_placement_requests_hospital ON placement_requests(hospital_id);
CREATE INDEX idx_placement_requests_facility ON placement_requests(facility_id);
CREATE INDEX idx_placement_requests_status ON placement_requests(status);
