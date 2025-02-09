const { data: { session } } = await supabase.auth.getSession(); console.log('Your user ID:', session?.user?.id);
