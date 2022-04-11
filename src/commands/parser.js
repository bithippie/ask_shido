export function parseCommand({user_id, text}) {
    let action = 'usage';
    
    let [ userAction, ...body ] = text.trim().split(/\s+/);
    
    userAction = userAction.replace(/[^a-zA-Z]+$/g, '');

    if (['ask', 'pose'].includes(userAction)) {
        action = userAction
        body = body.join(' ');
    }
    
    return { action, body, caller_id : user_id }
}
