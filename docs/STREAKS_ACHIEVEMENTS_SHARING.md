# Daily Streaks, Achievements, and Deck Sharing System

## Overview

This system adds three major engagement features to EasierStudying:

1. **Daily Streaks** - Track consecutive days of study
2. **Achievement System** - Gamified milestones and badges
3. **Deck Sharing** - Invite and collaborate with others

## Architecture

### Database Schema

#### `daily_streaks`
Tracks user study streaks:
- `current_streak`: Current consecutive days
- `longest_streak`: Personal record
- `last_study_date`: Last day studied

Automatically updated by trigger when new `study_sessions` are recorded.

#### `achievements`
Predefined achievement definitions:
- Categories: `streak`, `cards`, `accuracy`, `social`
- Requirement types: `streak_days`, `cards_studied`, `sessions_completed`, `accuracy_percent`, `social_shares`

Pre-populated with 9 default achievements.

#### `user_achievements`
Links users to earned achievements with timestamp.

#### `deck_invitations`
Manages invitation workflow:
- Status: `pending`, `accepted`, `declined`, `expired`
- Access levels: `view`, `edit`, `admin`
- Can track email-based or user-based invitations

#### `shared_deck_access`
Persistent access control after invitation accepted.

### Business Logic

**Streak Auto-Update**: Database trigger on `study_sessions.INSERT`
- First session: Streak = 1
- Session yesterday: Streak increments
- Session today: No change
- Gap > 1 day: Streak resets to 1

**Achievement Checking**: Function `check_and_award_achievements()`
- Evaluates all requirements
- Awards achievements when thresholds met
- Safe to call multiple times (UPSERT logic)

## Frontend Integration

### 1. Displaying Streaks

#### Compact Display
```tsx
import { StreakDisplay } from "@/components/study/StreakAndAchievements";

<StreakDisplay compact={true} />
```

#### Full Display with Milestones
```tsx
<StreakDisplay compact={false} showMilestones={true} />
```

### 2. Displaying Achievements

```tsx
import { AchievementsDisplay } from "@/components/study/StreakAndAchievements";

<AchievementsDisplay />
```

Shows:
- Overall progress (X/9 achieved)
- Next milestones to unlock
- Earned achievements gallery

### 3. Deck Sharing UI

#### Simple Share Button
```tsx
import { DeckShareButton } from "@/components/study/DeckSharing";

<DeckShareButton deckId={deckId} deckTitle={deckTitle} />
```

#### Manual Invitation Form
```tsx
import { DeckInviteDialog } from "@/components/study/DeckSharing";

<DeckInviteDialog 
  deckId={deckId} 
  open={showInvite} 
  onOpenChange={setShowInvite}
/>
```

#### Manage Shared Access
```tsx
import { SharedDeckAccessManager } from "@/components/study/DeckSharing";

<SharedDeckAccessManager deckId={deckId} />
```

#### View Pending Invitations
```tsx
import { PendingInvitations } from "@/components/study/DeckSharing";

<PendingInvitations />
```

## Hooks Reference

### useStreakAndAchievements()

```typescript
const {
  streakLoading,
  streakData: {
    currentStreak,
    longestStreak,
    studiedToday,
    daysUntilReset
  },
  achievementLoading,
  achievements: {
    earned,
    progress: {
      completedCount,
      totalCount,
      percentComplete,
      categories
    },
    nextMilestones
  },
  refetch
} = useStreakAndAchievements();
```

### useDeckInvitations()

```typescript
const {
  pendingInvitations,
  sentInvitations,
  sharedDecks,
  loading,
  send,      // async (deckId, email, accessLevel) => boolean
  accept,    // async (invitationId) => boolean
  decline,   // async (invitationId) => boolean
  cancel,    // async (invitationId) => boolean
  refetch    // async () => void
} = useDeckInvitations();
```

### useDeckAccessManagement(deckId)

```typescript
const {
  accessUsers,
  loading,
  updateAccess,  // async (userId, newLevel) => boolean
  revoke         // async (userId) => boolean
} = useDeckAccessManagement(deckId);
```

## Utility Functions

### Streak Management (`src/lib/streak-management.ts`)

```typescript
// Get user's streak data
const streak = await getUserStreak(userId);

// Get formatted stats
const stats = await getStreakStats(userId);

// Check if user studied today
const status = await getStreakStatus(userId);

// Calculate days until streak resets
const days = getDaysUntilStreakReset(lastStudyDate);

// Get milestone message
const msg = getStreakMilestoneMessage(streakDays);
```

### Achievement System (`src/lib/achievement-system.ts`)

```typescript
// Get all achievements
const achievements = await getAllAchievements();

// Get user's earned achievements
const earned = await getUserAchievements(userId);

// Get achievements by category
const streakAchievements = await getAchievementsByCategory('streak');

// Check specific achievement
const hasIt = await hasEarnedAchievement(userId, achievementId);

// Get progress
const progress = await getAchievementProgress(userId);

// Get next milestones
const next = await getNextMilestones(userId);

// Award (internal use)
await awardAchievement(userId, achievementId);

// Get how rare an achievement is
const rarity = await getAchievementRarity(achievementId);
```

### Deck Sharing (`src/lib/deck-sharing.ts`)

```typescript
// Create invitation
const inv = await createDeckInvitation(deckId, email, 'view');

// Accept/decline
await acceptDeckInvitation(invitationId);
await declineDeckInvitation(invitationId);

// Manage access
await updateDeckAccess(deckId, userId, 'edit');
await revokeDeckAccess(deckId, userId);

// Query
const pending = await getPendingInvitations(userId);
const sent = await getSentInvitations(userId);
const users = await getDeckAccessUsers(deckId);
const shared = await getSharedDecksForUser(userId);

// Check access
const level = await getUserDeckAccess(deckId, userId); // null or 'view'|'edit'|'admin'
```

## Integration Checklist

### 1. Database Setup
- [ ] Run migration: `20260208000000_add_streaks_achievements_invitations.sql`
- [ ] Verify 9 default achievements created
- [ ] Check RLS policies are enabled

### 2. Hook Integration
- [ ] Add to `MyDecks` component to show streaks
- [ ] Add to main dashboard for quick stats
- [ ] Add to study session completion for notifications

### 3. UI Components
- [ ] Add `StreakDisplay` to dashboard/homepage
- [ ] Add `AchievementsDisplay` to dedicated achievements page
- [ ] Add `DeckShareButton` to deck detail/edit pages
- [ ] Add `PendingInvitations` to notifications/inbox

### 4. Notifications
- [ ] Toast when achievement earned
- [ ] Toast when streak about to reset
- [ ] Toast when invitation received

### 5. Sharing Features
- [ ] Allow deck owners to invite others
- [ ] Allow non-owners to accept/decline
- [ ] Show shared decks separately in sidebar
- [ ] Implement access control (view vs edit)

## Customization

### Modify Default Achievements

Edit the INSERT statement in migration:

```sql
INSERT INTO public.achievements VALUES
  ('name', 'description', '🎯', 'category', 'requirement_type', value),
```

### Change Streak Reset Window

Currently 2 days after last study. Modify in `update_user_streak()` function:

```sql
v_last_study_date = v_today - INTERVAL '2 days' -- Change this
```

### Customize Access Levels

Edit `AccessLevel` type in `src/lib/deck-sharing.ts` and update constraints.

## Email Integration Setup

The `send-deck-invitation-email` function is a placeholder. To enable:

### Option 1: SendGrid (Recommended)

```typescript
import SendGridMail from "https://cdn.skypack.dev/@sendgrid/mail@7.7.0?dts";

const sgMail = SendGridMail(Deno.env.get("SENDGRID_API_KEY"));

await sgMail.send({
  to: email,
  from: "noreply@easierstudying.com",
  subject: `${inviterName} shared "${deckTitle}" with you`,
  html: generateInvitationEmail(inviterName, deckTitle, accessLevel),
});
```

### Option 2: Resend

```typescript
import { Resend } from "https://cdn.skypack.dev/resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

await resend.emails.send({
  from: "invitations@easierstudying.com",
  to: email,
  subject: `${inviterName} shared "${deckTitle}" with you`,
  html: generateInvitationEmail(inviterName, deckTitle, accessLevel),
});
```

### Option 3: AWS SES

Use AWS SDK for Deno with your SES configuration.

## Analytics Events

Consider tracking:

```typescript
// When streak milestone reached
analytics.track('streak_milestone', {
  streak_days: 7,
  milestone: 'week_warrior'
});

// When achievement earned
analytics.track('achievement_earned', {
  achievement_id: id,
  achievement_name: 'Month Master'
});

// When deck invitation sent
analytics.track('deck_invitation_sent', {
  deck_id: id,
  access_level: 'view',
  invitation_method: 'email'
});
```

## Performance Considerations

1. **Caching**: Cache achievement progress for 5 minutes
2. **Batch Updates**: Check achievements in bulk monthly
3. **Indexes**: Add indexes on `(user_id, created_at)` for queries
4. **Limits**: Set max invitations per user per day (rate limit)

## Security Notes

1. All operations use RLS policies
2. Only deck owners can share their decks
3. Email invitations should validate recipient email
4. Access levels enforced on content queries
5. Users can revoke access immediately

## Troubleshooting

### Streak not updating
- Check trigger `trigger_update_streak_on_study` exists
- Verify `study_sessions` insert is successful
- Check RLS policies on `daily_streaks`

### Achievements not awarded
- Verify achievement requirements match your use case
- Check `check_and_award_achievements()` is called
- Review SQL function syntax

### Invitations not working
- Verify RLS policies on `deck_invitations`
- Check email validation
- Test with known user emails first

## Future Enhancements

1. **Team Decks**: Multiple owners collaborating
2. **Achievement Tiers**: Different difficulty levels
3. **Streak Freezes**: Bonus tokens to prevent reset
4. **Leaderboards**: Global or friend-based ranking
5. **Social Features**: Comments, reactions, sharing stats
6. **Mobile Notifications**: Push alerts for streak reminders
7. **Achievements Export**: Share achievement badges on social media
