// Application commands for Fiovivor casting process
const applicationData = {
    'player-app': {
        message1: `Are you and your team prepared to take on **Victory Road** and pave your way to face the Elite 4 and the Champion?

Enter the command \`!trainer-card\` to start your interview.`,
        message2: `https://www.hxchector.com/wp-content/uploads/2013/12/pokemon_origins_green-blue_pokebal.gif`
    },

    'trainer-card': {
        message1: `First let's make sure everything is all set for your very own **Trainer Card!**

Please do remind us of your…
> 1. Name
> 2. Age
> 3. Pronouns
> 4. Timezone

As well as provide us with the following information…
> 5. At least **three different images** that we can use as graphics for you throughout the season
> 6. A color or hex code to use as your player role and for the cast sheet
> 7. Your favorite Pokemon (if any)!

Once you're all set, begin the *real* interview with the command \`!app-1\`.`,
        message2: `https://i.pinimg.com/originals/ce/a8/59/cea85959f35f77a4fc7ef1edc01ad69f.gif`
    },

    'app-1': {
        message1: `# QUESTION 1
Keep it real with me here.

*What is your purpose/reason for applying to this season– Are you perhaps interested in the theme, or maybe you have been a long-time Fiovivor enthusiast? Are you prepared to play against the very best Fiovivor has to offer?*

When you are ready to move on, continue the interview via \`!app-2\`.`,
        message2: `https://i.pinimg.com/originals/43/d7/3b/43d73b453c1f7da9ca77e1cb0d522a5b.gif`
    },

    'app-2': {
        message1: `# QUESTION 2
Now we'll dive into some personal territory…

*Tell us about your ORG history– Are you the kind of player who's always in a game, or do you come out of your retirement cave once a year to show us what you're really made of? Please share your experiences with any fun or notable games from your ORG career!*

*...and if you have NEVER played an ORG before, welcome to the big leagues, hot-shot! How do you want to approach the game for your first time playing?*

*ADDITIONALLY, what from your previous ORG runs do you plan to replicate here in Fiovivor– what worked for you that you want to keep going? What about your game do you plan on shaking up and changing? Give us the tea!*

When you are ready to move on, continue the interview via \`!app-3\`.`,
        message2: `https://giffiles.alphacoders.com/211/211160.gif`
    },

    'app-3': {
        message1: `# QUESTION 3
Bear with us here for sort of a "two-birds-one-stone" question.

*3a –> Every Survivor season is full of characters… heroes, villains, side-kicks, comedic reliefs, trainwrecks and so much more. How would you describe the kind of character you anticipate being this season?*

*3b –> Enough about Survivor and ORGs for a minute… how would you describe yourself as a person outside the game, and how would that compare to how OTHERS may describe you? Additionally, tell us about your hobbies and what you do for work/school!*

*The purpose of asking these two together as one question is because I believe who you are/what your personality is like DOES play a part in your character for a Survivor ORG season! If you want to take it a step further and say how you think they are intertwined you would for sure score a few brownie points.*

When you are ready to move on, continue the interview via \`!app-4\`.`,
        message2: `https://i.redd.it/p974aed79ewd1.gif`
    },

    'app-4': {
        message1: `# QUESTION 4
Now we've got a handful of smaller questions, you don't have to write too much for these.

*4a –> Who is the kind of person that you gravitate towards in Survivor; the kind of ally you want to have?*

*4b –> Those first few opening days of the game, how do you want to approach the social/strategy?*

*4c –> If you had to predict your vote-out or elimination right here, how would you be biting the dust?*

*4d –> Which Pokemon (or character within the franchise) do you plan on playing like this season? Why?*

…and that's it for all the questions! There are two more things you need to do to complete the interview.
> \`!acknowledgements\` –> Read over a few quick things. Make sure you know what you're getting yourself into!
> \`!dnc-list\` –> Have anyone that you refuse to play with/would rather not play with? Let us know!`,
        message2: `https://gifdb.com/images/high/i-ll-be-back-498-x-280-gif-4ov56rwcyk2idaru.gif`
    },

    'acknowledgements': {
        message1: `# ACKNOWLEDGEMENTS & UNDERSTANDINGS
In order for you to formally enter the casting pool, you must read and agree to all of the following:

1. *I have read the #rulebook and understand what I can be given a strike for. I recognize that cheating of any kind and extreme instances of toxicity will not be tolerated in this environment.*

2. *I am signing up for a game that can be very mentally taxing at times. While this ORG is important, I understand that real life and mental health will always take priority over a silly online game.*

3. *It is expected of me to do confessionals each episode in my confessional channel. I will not leave my confessional blank and actively contribute content (and my personal narrative) to the season!*

4. *I understand that this will be a time commitment, and I will do my best to be available as often as I can be. While it is not expected of me to be on Discord 24/7, I have the free time needed to be an active participant in the game.*

If you don't want to fill out a DNC list, you're done! Ping the hosts to let them know you're done.
If you DO feel the need to fill one out, the command to do so is \`!dnc-list\`.`,
        message2: `https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyZzlwbzRkcGtvejhoZGJyYW01OHB4bnhjdGR3NGkzYmwxcjM0NnBkciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3BwNcKOTAVWBa/source.gif`
    },

    'dnc-list': {
        message1: `# DNC INFO
Let me be very clear– I do not like cancel culture, and I especially do not like a mob mentality against one particular person… HOWEVER, I want to ensure that every one of my players feels comfortable within the game. So with that being said, here is how this will work.

If you have someone who you have PERSONAL beef with or someone who you just absolutely cannot stand for one reason or another, please let us know their name and discord tag. We can guarantee that you will not start on the same Tribe to minimize the impact of your feud/prevent metagaming.

If there is someone who you OBJECTIVELY believe should not be allowed to touch this season with a 20-foot pole, please let us know their name, discord tag and a list of reasons they should not play the season. We 100% expect you to provide evidence (screenshots, docs, whatever) to back up your claims here.

After this… you're done! Ping hosts to let them know!`,
        message2: null // No second message for dnc-list
    },

    'invitation': {
        message1: `# ATTENTION!
This section of the application is reserved for players who were specifically **HAND-PICKED** by Fio to play the season. If you were not explicitly told to run this command, **you are not meant to be running it right now.**

**In the wrong place?** No worries! We'd still love to potentially host you!! Please run the command \`!player-app\` to be redirected to the right place!

**In the right place?** Perfect! Run the command \`!invitation-1\` to get started!`,
        message2: null // No second message for invitation
    },

    'invitation-1': {
        message1: `First let's make sure everything is all set for your very own **Trainer Card!**

Please do remind us of your…
> 1. Name
> 2. Age
> 3. Pronouns
> 4. Timezone

As well as provide us with the following information…
> 5. At least **three different images** that we can use as graphics for you throughout the season
> 6. A color or hex code to use as your player role and for the cast sheet
> 7. Your favorite Pokemon (if any)!

Once you're all set, we have just a few questions for you! Run the command \`!invitation-2\` to proceed.`,
        message2: `https://i.pinimg.com/originals/ce/a8/59/cea85959f35f77a4fc7ef1edc01ad69f.gif`
    },

    'invitation-2': {
        message1: `We've got three questions for you today.

> 1. Just for a quick refresher, tell us about yourself! Who are you as a person and player? What do you do in real life for fun or as a part of the daily grind?
> 2. Why do you think you got the invite to play this season in the first place? What is it about you that you feel like you qualify as a part of "the best of the best"?
> 3. How would you describe the kind of player and character you anticipate being? We know that you WILL make a splash this season, the question is HOW?

When you're done with these questions, we need one (*potentially* two) more things from you. 

> \`!acknowledgements\` –> Read over a few quick things. Make sure you know what you're getting yourself into!
> \`!dnc-list\` –> Have anyone that you refuse to play with/would rather not play with? Let us know!`,
        message2: `https://64.media.tumblr.com/8d29ce82b0b7bc1bca36eac57ae5bc29/fb2b2434dedcb140-8e/s540x810/b551b8c1117a1589e3b64a65b3c52141a4abddee.gif`
    }
};

module.exports = {
    applicationData,

    // Function to handle application commands
    async handleApplicationCommand(message, commandName) {
        const data = applicationData[commandName];
        if (!data) return false; // Command not found

        try {
            // Send first message
            await message.reply(data.message1);

            // Send second message if it exists
            if (data.message2) {
                setTimeout(async () => {
                    try {
                        await message.channel.send(data.message2);
                    } catch (error) {
                        console.error('Error sending second application message:', error);
                    }
                }, 2000); // 2 second delay
            }

            return true; // Command was handled
        } catch (error) {
            console.error('Error in application command handler:', error);
            return false;
        }
    }
};