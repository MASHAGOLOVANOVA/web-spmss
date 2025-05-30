CREATE TABLE IF NOT EXISTS cloud_folder (
    id TEXT NOT NULL,
    link TEXT,
    primary_key INT NOT NULL auto_increment,
    PRIMARY KEY(primary_key)
);

INSERT INTO cloud_folder (primary_key)
SELECT cloud_id
FROM project
WHERE cloud_id IS NOT NULL; 

ALTER TABLE project 
ADD CONSTRAINT FK_PrClf FOREIGN KEY (cloud_id) REFERENCES cloud_folder(primary_key) ON DELETE CASCADE ON UPDATE CASCADE;