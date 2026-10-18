const db = require('../config/db');

const Skill = {
    // Get all available skills
    getAllSkills: async () => {
        return await db.any(
            `SELECT skill_id, skill_name, category_id
             FROM skills
             ORDER BY skill_name`
        );
    },

    // Get skills belonging to a user
    getUserSkills: async (userId) => {
        return await db.any(
            `SELECT
                us.user_skill_id,
                us.user_id,
                us.skill_id,
                s.skill_name,
                us.skill_type,
                us.proficiency
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.skill_id
             WHERE us.user_id = $1
             ORDER BY s.skill_name`,
            [userId]
        );
    },

    // Add a skill for a user
    addUserSkill: async (userId, skillId, skillType, proficiency) => {
        return await db.one(
            `INSERT INTO user_skills
                (user_id, skill_id, skill_type, proficiency)
             VALUES ($1, $2, $3, $4)
             RETURNING user_skill_id, user_id, skill_id,
                       skill_type, proficiency`,
            [userId, skillId, skillType, proficiency]
        );
    },

    // Remove a skill from a user
    removeUserSkill: async (userId, userSkillId) => {
        const result = await db.result(
            `DELETE FROM user_skills
             WHERE user_skill_id = $1 AND user_id = $2`,
            [userSkillId, userId]
        );

        return result.rowCount > 0;
    }
};

module.exports = Skill;