    JSProxy

    Validate assignments to variables at runtime. Variables can hold instances of html tags or 
    values of a JavaScript type (all lowercase) or instances of an object (start with capital). 
    A string descibing the error is given as parameter to the onError handler if criteria aren't 
    met.

    let settings = new JSProxy({
            myVar: false,
            intVal: 100
        }, {
            myVar: 'boolean',
            intVal: 'number|>50|<2000',
            serialRate: 'number|=57600|=115200',
            myString: 'string|notNull',
            myObject: 'object',
            myArray: 'Array',
            me: 'Person',
            anotherObject: 'object{' +
                    '"prop1":"number|>100",' +
                    '"prop2": {' +
                        '"prop3":"string"'+
                    '}' +
                '}'
        },
        'types',
        onSuccess,
        onError
    )

    settings.myVar will always be boolean when set
    
    Or:

    let html = new JSProxy({
            video: null
        },
        {
            video: 'video'
        },
        'tags'
    )

    html.video will always be an instance of a video tag. If null a video element will be 
    created when accessed : e.g. html.video.play() will not fail.