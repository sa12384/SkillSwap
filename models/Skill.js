const pool = require('../config/db');

const Skill = {
    getAllSkills: async () => {
        const r = await pool.query(
            `SELECT skill_id, skill_name, category_id FROM skills ORDER BY skill_name`);
        return r.rows;
    },

    getUserSkills: async (userId) => {
        const r = await pool.query(
            `SELECT us.user_skill_id, us.user_id, us.skill_id, s.skill_name,
                    us.skill_type, us.proficiency
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.skill_id
             WHERE us.user_id = $1
             ORDER BY s.skill_name`, [userId]);
        return r.rows;
    },

    addUserSkill: async (userId, skillId, skillType, proficiency) => {
        const r = await pool.query(
            `INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency)
             VALUES ($1, $2, $3, $4)
             RETURNING user_skill_id, user_id, skill_id, skill_type, proficiency`,
            [userId, skillId, skillType, proficiency]);
        return r.rows[0];
    },

    removeUserSkill: async (userId, userSkillId) => {
        const r = await pool.query(
            `DELETE FROM user_skills WHERE user_skill_id = $1 AND user_id = $2`,
            [userSkillId, userId]);
        return r.rowCount > 0;
    }
};

module.exports = Skill;