ALTER TABLE usuarios
ADD COLUMN profile_image_url TEXT;

ALTER TABLE couriers
ADD COLUMN dpi_photo_url TEXT,
ADD COLUMN profile_photo_url TEXT;

ALTER TABLE restaurantes
ADD COLUMN logo_url TEXT;
