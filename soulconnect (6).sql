-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 23, 2025 at 09:03 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `soulconnect`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_roles`
--

CREATE TABLE `admin_roles` (
  `admin_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_roles`
--

INSERT INTO `admin_roles` (`admin_id`, `role_name`) VALUES
(1, 'user'),
(2, 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `message_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_text` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_rooms`
--

CREATE TABLE `chat_rooms` (
  `room_id` int(11) NOT NULL,
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `extra`
--

CREATE TABLE `extra` (
  `extra_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `education` text DEFAULT NULL,
  `hobby` text DEFAULT NULL,
  `about_you` text DEFAULT NULL,
  `job` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `extra`
--

INSERT INTO `extra` (`extra_id`, `user_id`, `education`, `hobby`, `about_you`, `job`) VALUES
(1, 1, 'Degree in Arts', 'Loves cycling', 'Hi, I am alex01. I enjoy meeting new people and exploring new places.', NULL),
(2, 2, 'Degree in Science', 'Loves cycling', 'Hi, I am sarah02. I enjoy meeting new people and exploring new places.', NULL),
(3, 3, 'Degree in Arts', 'Loves cycling', 'Hi, I am john03. I enjoy meeting new people and exploring new places.', NULL),
(4, 4, 'Degree in Engineering', 'Loves coding', 'Hi, I am emma04. I enjoy meeting new people and exploring new places.', NULL),
(5, 5, 'Degree in Arts', 'Loves gaming', 'Hi, I am mike05. I enjoy meeting new people and exploring new places.', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

CREATE TABLE `gallery` (
  `gallery_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gallery_images`
--

CREATE TABLE `gallery_images` (
  `image_id` int(11) NOT NULL,
  `gallery_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `likes`
--

CREATE TABLE `likes` (
  `like_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `liked_user_id` int(11) NOT NULL,
  `liked_back` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `likes`
--

INSERT INTO `likes` (`like_id`, `user_id`, `liked_user_id`, `liked_back`, `created_at`) VALUES
(1, 1, 2, 0, '2025-01-22 12:00:48'),
(2, 2, 1, 0, '2025-01-22 12:53:38'),
(3, 4, 5, 0, '2025-01-22 13:50:54'),
(4, 5, 4, 0, '2025-01-22 13:51:04'),
(5, 4, 3, 0, '2025-01-22 14:08:57'),
(6, 3, 4, 0, '2025-01-22 14:09:09');

--
-- Triggers `likes`
--
DELIMITER $$
CREATE TRIGGER `after_like_insert` AFTER INSERT ON `likes` FOR EACH ROW BEGIN
  INSERT INTO matches (user1_id, user2_id)
  SELECT LEAST(NEW.user_id, NEW.liked_user_id), GREATEST(NEW.user_id, NEW.liked_user_id)
  FROM likes
  WHERE user_id = NEW.liked_user_id AND liked_user_id = NEW.user_id
  AND NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE (user1_id = LEAST(NEW.user_id, NEW.liked_user_id) 
           AND user2_id = GREATEST(NEW.user_id, NEW.liked_user_id))
  );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `matches`
--

CREATE TABLE `matches` (
  `match_id` int(11) NOT NULL,
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `matched_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `matches`
--

INSERT INTO `matches` (`match_id`, `user1_id`, `user2_id`, `matched_at`) VALUES
(1, 1, 2, '2025-01-22 13:49:10'),
(2, 4, 5, '2025-01-22 13:51:04'),
(3, 3, 4, '2025-01-22 14:09:09');

-- --------------------------------------------------------

--
-- Table structure for table `relationship`
--

CREATE TABLE `relationship` (
  `relationship_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `preference` enum('male','female') NOT NULL,
  `one_liner` varchar(255) DEFAULT NULL,
  `relation` enum('or','cr','fwb') NOT NULL,
  `location` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `relationship`
--

INSERT INTO `relationship` (`relationship_id`, `user_id`, `preference`, `one_liner`, `relation`, `location`) VALUES
(1, 1, 'male', 'I am user 1 looking for something special.', 'cr', 2),
(2, 2, 'male', 'I am user 2 looking for something special.', 'fwb', 16),
(3, 4, 'female', 'I am user 4 looking for something special.', 'or', 31),
(4, 5, 'male', 'I am user 5 looking for something special.', 'fwb', 43),
(5, 3, 'male', 'I am user 3 looking for something special.', 'or', 19);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `birth_date` date NOT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `gender` enum('male','female') NOT NULL,
  `accept_service` tinyint(1) NOT NULL DEFAULT 0,
  `payment` tinyint(1) NOT NULL DEFAULT 0,
  `foto` varchar(255) DEFAULT NULL,
  `admin` int(11) NOT NULL DEFAULT 1,
  `verification_token` varchar(64) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `nickname`, `email`, `password`, `birth_date`, `zip_code`, `gender`, `accept_service`, `payment`, `foto`, `admin`, `verification_token`, `is_verified`, `created_at`) VALUES
(1, 'alex01', 'alex01@example.com', 'hashedpass01', '1995-03-15', '12345', 'male', 1, 0, 'profile1.jpg', 1, NULL, 0, '2025-01-22 14:18:50'),
(2, 'sarah02', 'sarah02@example.com', 'hashedpass02', '1992-07-22', '54321', 'male', 1, 1, 'profile2.jpg', 1, NULL, 0, '2025-01-22 14:18:50'),
(3, 'john03', 'john03@example.com', 'hashedpass03', '1989-05-30', '67890', 'male', 1, 0, 'profile3.jpg', 2, NULL, 0, '2025-01-22 14:18:50'),
(4, 'emma04', 'emma04@example.com', 'hashedpass04', '2000-12-10', '13579', 'female', 1, 1, 'profile4.jpg', 1, NULL, 0, '2025-01-22 14:18:50'),
(5, 'mike05', 'mike05@example.com', 'hashedpass05', '1997-08-14', '24680', 'male', 1, 1, 'profile5.jpg', 1, NULL, 0, '2025-01-22 14:18:50'),
(7, 'john_doe', 'johndoe@example.com', '$2b$10$JbFqCTsa1eg0XFymm8gQsedg1H/w2XU1LrnNXvwiJhYqBctWEBEoC', '1990-01-01', '12345', 'male', 1, 0, 'profile.jpg', 1, 'f2a3c3638e043d95479f9a2c0718f8d27b842838baa41b85415757fcf6ba67dd', 0, '2025-01-22 14:18:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_roles`
--
ALTER TABLE `admin_roles`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `user_pair` (`user1_id`,`user2_id`),
  ADD KEY `user2_id` (`user2_id`);

--
-- Indexes for table `extra`
--
ALTER TABLE `extra`
  ADD PRIMARY KEY (`extra_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `gallery`
--
ALTER TABLE `gallery`
  ADD PRIMARY KEY (`gallery_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `gallery_id` (`gallery_id`);

--
-- Indexes for table `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`like_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `liked_user_id` (`liked_user_id`);

--
-- Indexes for table `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`match_id`),
  ADD UNIQUE KEY `unique_match` (`user1_id`,`user2_id`),
  ADD KEY `user2_id` (`user2_id`);

--
-- Indexes for table `relationship`
--
ALTER TABLE `relationship`
  ADD PRIMARY KEY (`relationship_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `admin` (`admin`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `extra`
--
ALTER TABLE `extra`
  MODIFY `extra_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `gallery_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gallery_images`
--
ALTER TABLE `gallery_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `likes`
--
ALTER TABLE `likes`
  MODIFY `like_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `matches`
--
ALTER TABLE `matches`
  MODIFY `match_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `relationship`
--
ALTER TABLE `relationship`
  MODIFY `relationship_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_rooms_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `extra`
--
ALTER TABLE `extra`
  ADD CONSTRAINT `extra_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `gallery`
--
ALTER TABLE `gallery`
  ADD CONSTRAINT `gallery_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD CONSTRAINT `gallery_images_ibfk_1` FOREIGN KEY (`gallery_id`) REFERENCES `gallery` (`gallery_id`) ON DELETE CASCADE;

--
-- Constraints for table `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`liked_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `matches`
--
ALTER TABLE `matches`
  ADD CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `relationship`
--
ALTER TABLE `relationship`
  ADD CONSTRAINT `relationship_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`admin`) REFERENCES `admin_roles` (`admin_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
