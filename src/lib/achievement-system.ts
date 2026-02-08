/**
 * Achievement System Management
 * Handles user achievements and milestones
 */

import { supabase } from "@/integrations/supabase/client";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "cards" | "accuracy" | "social";
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

/**
 * Get all available achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("requirement_value", { ascending: true });

    if (error) throw error;
    return (data as Achievement[]) || [];
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }
}

/**
 * Get user's earned achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        id,
        user_id,
        achievement_id,
        earned_at,
        achievements:achievement_id (
          id,
          name,
          description,
          icon,
          category,
          requirement_type,
          requirement_value,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) throw error;

    return (data as unknown as Array<{
      id: string;
      user_id: string;
      achievement_id: string;
      earned_at: string;
      achievements: Achievement | Achievement[];
    }>).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      achievement_id: item.achievement_id,
      earned_at: item.earned_at,
      achievement: Array.isArray(item.achievements) ? item.achievements[0] : item.achievements,
    }));
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(
  category: "streak" | "cards" | "accuracy" | "social"
): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("category", category)
      .order("requirement_value", { ascending: true });

    if (error) throw error;
    return (data as Achievement[]) || [];
  } catch (error) {
    console.error("Error fetching achievements by category:", error);
    return [];
  }
}

/**
 * Check if user has earned specific achievement
 */
export async function hasEarnedAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking achievement:", error);
    return false;
  }
}

/**
 * Get achievement progress for a user
 */
export async function getAchievementProgress(userId: string): Promise<{
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  categories: Record<string, { completed: number; total: number }>;
}> {
  try {
    const [userAchievements, allAchievements] = await Promise.all([
      getUserAchievements(userId),
      getAllAchievements(),
    ]);

    const completedIds = new Set(userAchievements.map((a) => a.achievement_id));

    const categories: Record<string, { completed: number; total: number }> = {
      streak: { completed: 0, total: 0 },
      cards: { completed: 0, total: 0 },
      accuracy: { completed: 0, total: 0 },
      social: { completed: 0, total: 0 },
    };

    allAchievements.forEach((achievement) => {
      const category = achievement.category;
      categories[category].total += 1;

      if (completedIds.has(achievement.id)) {
        categories[category].completed += 1;
      }
    });

    const completedCount = userAchievements.length;
    const totalCount = allAchievements.length;

    return {
      completedCount,
      totalCount,
      percentComplete: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      categories,
    };
  } catch (error) {
    console.error("Error getting achievement progress:", error);
    return {
      completedCount: 0,
      totalCount: 0,
      percentComplete: 0,
      categories: {
        streak: { completed: 0, total: 0 },
        cards: { completed: 0, total: 0 },
        accuracy: { completed: 0, total: 0 },
        social: { completed: 0, total: 0 },
      },
    };
  }
}

/**
 * Get next achievable milestones for a user
 */
export async function getNextMilestones(userId: string): Promise<Achievement[]> {
  try {
    const userAchievements = await getUserAchievements(userId);
    const allAchievements = await getAllAchievements();

    const completedIds = new Set(userAchievements.map((a) => a.achievement_id));

    // Get next uncompleted achievement from each category
    const categories = new Set<string>();
    const nextMilestones: Achievement[] = [];

    allAchievements.forEach((achievement) => {
      if (!completedIds.has(achievement.id) && !categories.has(achievement.category)) {
        nextMilestones.push(achievement);
        categories.add(achievement.category);
      }
    });

    return nextMilestones.slice(0, 4); // Return up to 4 next milestones
  } catch (error) {
    console.error("Error getting next milestones:", error);
    return [];
  }
}

/**
 * Award achievement to user (called by backend)
 */
export async function awardAchievement(userId: string, achievementId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_achievements")
      .insert({ user_id: userId, achievement_id: achievementId })
      .select();

    if (error && error.code !== "23505") {
      // 23505 = unique constraint violation (already earned)
      throw error;
    }

    return !error;
  } catch (error) {
    console.error("Error awarding achievement:", error);
    return false;
  }
}

/**
 * Get achievement rarity (how many users have it)
 */
export async function getAchievementRarity(achievementId: string): Promise<{
  earnedByUserCount: number;
  percentageOfUsers: number;
}> {
  try {
    const [earnedCount, totalUsers] = await Promise.all([
      supabase
        .from("user_achievements")
        .select("id", { count: "exact" })
        .eq("achievement_id", achievementId),
      supabase.from("profiles").select("id", { count: "exact" }),
    ]);

    const earnedByUserCount = earnedCount.count || 0;
    const totalUserCount = totalUsers.count || 1;
    const percentageOfUsers = totalUserCount > 0 ? (earnedByUserCount / totalUserCount) * 100 : 0;

    return {
      earnedByUserCount,
      percentageOfUsers: Math.round(percentageOfUsers * 10) / 10,
    };
  } catch (error) {
    console.error("Error getting achievement rarity:", error);
    return { earnedByUserCount: 0, percentageOfUsers: 0 };
  }
}
