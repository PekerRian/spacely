#[test_only]
module spacely3::profiles3_tests {
    use std::string::{String, Self};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use spacely3::profiles3;

    // Test constants
    const USERNAME: vector<u8> = b"testuser";
    const PROFILE_IMG: vector<u8> = b"https://example.com/img.jpg";
    const AFFILIATION: vector<u8> = b"Test Org";
    const BIO: vector<u8> = b"Test bio";
    const TWITTER_URL: vector<u8> = b"https://twitter.com/testuser";
    const TEST_MESSAGE: vector<u8> = b"Hello, this is a test message!";
    const BADGE_HASH: vector<u8> = b"badge123";

    fun setup(admin: &signer, framework: &signer) {
        // Set up timestamp for testing
        timestamp::set_time_has_started_for_testing(framework);
        // Initialize the module
        profiles3::init_module_for_test(admin);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_profile_creation(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Verify profile data
        let (name, bio, img, affil, friend_count, _, _, addr) = profiles3::get_profile(profile);
        assert!(string::bytes(&name) == &USERNAME, 1);
        assert!(string::bytes(&bio) == &BIO, 2);
        assert!(string::bytes(&img) == &PROFILE_IMG, 3);
        assert!(string::bytes(&affil) == &AFFILIATION, 4);
        assert!(friend_count == 0, 5);
        assert!(addr == signer::address_of(admin), 6);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_update_profile(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Update profile
        let new_bio = string::utf8(b"Updated bio");
        let new_img = string::utf8(b"new_img.jpg");
        let new_affil = string::utf8(b"New Org");

        profiles3::update_bio(admin, profile, new_bio);
        profiles3::update_profile_image(admin, profile, new_img);
        profiles3::update_affiliation(admin, profile, new_affil);

        // Verify updates
        let (_, bio, img, affil, _, _, _, _) = profiles3::get_profile(profile);
        assert!(string::bytes(&bio) == string::bytes(&new_bio), 1);
        assert!(string::bytes(&img) == string::bytes(&new_img), 2);
        assert!(string::bytes(&affil) == string::bytes(&new_affil), 3);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_friend_operations(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile1 = profiles3::create_profile(
            admin,
            string::utf8(b"user1"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user1")
        );

        let profile2 = profiles3::create_profile(
            admin,
            string::utf8(b"user2"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user2")
        );

        // Add friend
        profiles3::add_friend(admin, profile1, profile2);
        assert!(profiles3::is_friend(profile1, profile2), 1);

        // Remove friend
        profiles3::remove_friend(admin, profile1, profile2);
        assert!(!profiles3::is_friend(profile1, profile2), 2);
    }

    #[test(admin = @spacely3, other_user = @0x123, framework = @aptos_framework)]
    public fun test_badge_operations(admin: &signer, other_user: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Test that admin can add badge
        let badge1 = string::utf8(BADGE_HASH);
        profiles3::add_badge(admin, profile, badge1);

        let badges = profiles3::get_badges(profile);
        assert!(vector::contains(&badges, &badge1), 1);

        // Test that another user can also add badge
        let badge2 = string::utf8(b"another_badge");
        profiles3::add_badge(other_user, profile, badge2);

        let badges = profiles3::get_badges(profile);
        assert!(vector::contains(&badges, &badge2), 2);

        // Test that duplicate badges aren't added
        profiles3::add_badge(other_user, profile, badge2);
        let badges = profiles3::get_badges(profile);
        assert!(vector::length(&badges) == 2, 3); // Still only 2 badges
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_messaging(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile1 = profiles3::create_profile(
            admin,
            string::utf8(b"user1"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user1")
        );

        let profile2 = profiles3::create_profile(
            admin,
            string::utf8(b"user2"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user2")
        );

        profiles3::send_message(profile1, profile2, string::utf8(TEST_MESSAGE));

        // Delete message
        profiles3::delete_message(profile1, 0);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_space_operations(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        let topics = vector::empty<String>();
        vector::push_back(&mut topics, string::utf8(b"Move"));
        vector::push_back(&mut topics, string::utf8(b"Blockchain"));

        profiles3::create_space(
            admin,
            profile,
            string::utf8(b"Move Language Tutorial"),
            0, // current time
            string::utf8(b"English"),
            topics
        );

        let spaces = profiles3::get_spaces(profile);
        assert!(vector::length(&spaces) == 1, 1);

        // Update space
        let new_topics = vector::empty<String>();
        vector::push_back(&mut new_topics, string::utf8(b"Move"));
        vector::push_back(&mut new_topics, string::utf8(b"Smart Contracts"));

        profiles3::update_space(
            admin,
            profile,
            0, // first space
            string::utf8(b"Advanced Move Tutorial"),
            1, // new time
            new_topics
        );

        let updated_spaces = profiles3::get_spaces(profile);
        let space = *vector::borrow(&updated_spaces, 0);
        assert!(profiles3::get_space_name(space) == string::utf8(b"Advanced Move Tutorial"), 2);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_transfer_and_mutability(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Verify initial mutability
        assert!(profiles3::is_mutable(profile), 1);

        // Disable transfers
        profiles3::disable_transfer(admin, profile);
        assert!(!profiles3::is_mutable(profile), 2);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_twitter_url_update(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Update twitter URL
        let new_twitter_url = string::utf8(b"https://twitter.com/newhandle");
        profiles3::update_twitter_url(admin, profile, new_twitter_url);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    #[expected_failure(abort_code = 0x80001, location = spacely3::profiles3)] // error::already_exists(PROFILE_ALREADY_EXISTS)
    public fun test_duplicate_username(admin: &signer, framework: &signer) {
        setup(admin, framework);
        
        // Create first profile
        profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Try to create second profile with same username (should fail)
        profiles3::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );
    }
}
